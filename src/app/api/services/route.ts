import { validateCsrfRequest } from "@/lib/csrf";
import { auth } from "@/lib/auth";
import { cachedQuery, invalidateCache } from "@/lib/cache";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared expert service select
// ---------------------------------------------------------------------------
const expertSelect = {
  id: true,
  profession: true,
  category: true,
  location: true,
  experienceYears: true,
  fee: true,
  bio: true,
  qualifications: true,
  rating: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      preferredName: true,
      username: true,
      profileImage: true,
      isVerified: true,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// GET /api/services  — paginated expert services
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;

    const category = searchParams.get("category") ?? undefined;
    const location = searchParams.get("location") ?? undefined;
    const search   = searchParams.get("search") ?? undefined;
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip     = (page - 1) * limit;

    const cacheKey = `list:page:${page}:limit:${limit}:cat:${category ?? ''}:loc:${location ?? ''}:q:${search ?? ''}`;

    // Pattern: cachedQuery(key, fetcher, ttl, namespace)
    // The namespace 'services' allows us to atomically invalidate all related cache entries at once
    const [services, total] = await cachedQuery(
      cacheKey,
      async () => {
        const where = {
          ...(category ? { category } : {}),
          ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
          ...(search
            ? {
                OR: [
                  { profession: { contains: search, mode: "insensitive" as const } },
                  { category: { contains: search, mode: "insensitive" as const } },
                  { bio: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        };

        return Promise.all([
          db.expertService.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: expertSelect,
          }),
          db.expertService.count({ where }),
        ]);
      },
      600,
      'services'
    );

    return NextResponse.json({
      services,
      nextPage: skip + limit < total ? page + 1 : null,
      total,
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/services]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/services  — register expert service (auth required)
// ---------------------------------------------------------------------------
const createServiceSchema = z.object({
  profession:      z.string().min(2, "Profession must be at least 2 characters."),
  category:        z.string().min(1, "Category is required."),
  location:        z.string().min(1, "Location is required."),
  experienceYears: z.number().int().min(0, "Experience years must be non-negative."),
  fee:             z.string().min(1, "Fee is required."),
  bio:             z.string().min(20, "Bio must be at least 20 characters."),
  qualifications:  z.array(z.string()).min(1, "At least one qualification is required."),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfError = validateCsrfRequest(req);
  if (csrfError) return csrfError;

try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const parsed = createServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const existing = await db.expertService.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a registered expert service." },
        { status: 409 }
      );
    }

    const service = await db.expertService.create({
      data: { userId, ...parsed.data },
      select: expertSelect,
    });

    // Set user serviceRegistrationStatus to PENDING
    await db.user.update({
      where: { id: userId },
      data: { serviceRegistrationStatus: "PENDING" },
    });

    await invalidateCache('services');

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/services]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
