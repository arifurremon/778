import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ shopId: string }> };

// GET /api/admin/shops/[shopId] — shop detail with products + owner
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

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
            email: true,
            profileImage: true,
            isVerified: true,
            registrationStatus: true,
            mobile: true,
            location: true,
            createdAt: true,
            _count: { select: { posts: true } },
          },
        },
        products: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            images: true,
            inStock: true,
            category: true,
            createdAt: true,
          },
        },
        _count: { select: { products: true } },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/shops/[shopId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/shops/[shopId] — toggle verification
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { shopId } = await params;
    const body = await req.json() as { isVerified: boolean; trustScore?: number };

    const shop = await db.shop.update({
      where: { id: shopId },
      data: {
        isVerified: body.isVerified,
        ...(body.trustScore !== undefined ? { trustScore: body.trustScore } : {}),
      },
      select: { id: true, isVerified: true, trustScore: true },
    });

    return NextResponse.json(shop);
  } catch (error) {
    logErrorToSentry(error, { route: "[PATCH /api/admin/shops/[shopId]]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
