import { logErrorToSentry } from "@/lib/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/admin/shops  — paginated shops list
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const verified = searchParams.get("verified"); // "true" | "false" | null

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (verified === "true") where.isVerified = true;
    else if (verified === "false") where.isVerified = false;

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              registrationStatus: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
      }),
      db.shop.count({ where }),
    ]);

    return NextResponse.json({
      shops,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/admin/shops]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
