import { auth } from "@/lib/auth";
import { requireActiveMutation } from "@/lib/session-guards";
import { cachedQuery, invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { rateLimiters, runRateLimit } from "@/lib/rate-limit";
import { enforceRateLimit } from "@/lib/rate-limit-request";
import { sanitizeUserInput } from "@/lib/sanitize";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared shop select
// ---------------------------------------------------------------------------
const shopSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  location: true,
  trustScore: true,
  rating: true,
  isVerified: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      profileImage: true,
      isVerified: true,
    },
  },
  _count: { select: { products: true } },
} as const;

// ---------------------------------------------------------------------------
// GET /api/shops  — paginated, filterable
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;

    const category = searchParams.get("category") ?? undefined;
    const location = searchParams.get("location") ?? undefined;
    const search = searchParams.get("search") || "";
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip     = (page - 1) * limit;

    const cacheKey = `list:page:${page}:limit:${limit}:cat:${category ?? ''}:loc:${location ?? ''}:q:${search ?? ''}`;

    // Pattern: cachedQuery(key, fetcher, ttl, namespace)
    // The namespace 'shops' allows us to atomically invalidate all related cache entries at once
    const [shops, total] = await cachedQuery(
      cacheKey,
      async () => {
        const where = {
          ...(category ? { category } : {}),
          ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { category: { contains: search, mode: "insensitive" as const } },
            ],
          }),
        };

        return Promise.all([
          db.shop.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: shopSelect,
          }),
          db.shop.count({ where }),
        ]);
      },
      600,
      'shops'
    );

    return NextResponse.json({
      shops,
      nextPage: skip + limit < total ? page + 1 : null,
      total,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/shops]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/shops  — register new shop (auth required)
// ---------------------------------------------------------------------------
const createShopSchema = z.object({
  name:        z.string().min(2, "Shop name must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category:    z.string().min(1, "Category is required."),
  location:    z.string().min(1, "Location is required."),
  payoutMethod: z.enum(["BKASH", "NAGAD", "BANK"]).optional(),
  registrationDetails: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const rateLimitResponse = await enforceRateLimit(
      () => runRateLimit(rateLimiters.shopRegistration, session.user.id),
      "ShopRegistration",
      { quotaExceededMessage: "Shop registration limit reached (3/hour)." }
    );
    if (rateLimitResponse) return rateLimitResponse;

    const body: unknown = await req.json();
    const parsed = createShopSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const existingShop = await db.shop.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existingShop) {
      return NextResponse.json(
        { error: "You already have a registered shop." },
        { status: 409 }
      );
    }

    let { name, description, category, location } = parsed.data;
    const { payoutMethod, registrationDetails } = parsed.data;
    
    name = sanitizeUserInput(name);
    description = sanitizeUserInput(description);
    category = sanitizeUserInput(category);
    location = sanitizeUserInput(location);

    const shop = await db.shop.create({
      data: {
        userId,
        name,
        description,
        category,
        location,
        ...(payoutMethod ? { payoutMethod } : {}),
        ...(registrationDetails ? { registrationDetails: registrationDetails as Prisma.InputJsonValue } : {}),
      },
      select: shopSelect,
    });

    // Set user registrationStatus to PENDING
    await db.user.update({
      where: { id: userId },
      data: { registrationStatus: "PENDING" },
    });

    await invalidateCache('shops');

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/shops]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
