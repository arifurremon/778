import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logErrorToSentry } from "@/lib/error-handler";
import { NextResponse } from "next/server";

const sellerShopSelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  location: true,
  isVerified: true,
  rating: true,
  trustScore: true,
} as const;

// GET /api/shops/me — current user's shop (seller console)
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await db.shop.findUnique({
      where: { userId: session.user.id },
      select: sellerShopSelect,
    });

    if (!shop) {
      return NextResponse.json({ error: "You don't own a shop yet." }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/shops/me]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
