import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ shopId: string }> };

// ---------------------------------------------------------------------------
// GET /api/shops/[shopId]  — single shop with products + owner info (public)
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { shopId } = await params;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        location: true,
        trustScore: true,
        rating: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
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
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            originalPrice: true,
            images: true,
            inStock: true,
            category: true,
            createdAt: true,
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/shops/[shopId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/shops/[shopId]  — update shop (owner only)
// ---------------------------------------------------------------------------
const updateShopSchema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  category:    z.string().min(1).optional(),
  location:    z.string().min(1).optional(),
}).strict();

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shopId } = await params;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { id: true, userId: true },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    if (shop.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this shop." },
        { status: 403 }
      );
    }

    const body: unknown = await req.json();
    const parsed = updateShopSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const updated = await db.shop.update({
      where: { id: shopId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        location: true,
        trustScore: true,
        rating: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/shops/[shopId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
