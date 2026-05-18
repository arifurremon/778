import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatAPIError, logErrorToSentry } from "@/lib/error-handler";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/admin/products  — all products across all shops
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const inStock = searchParams.get("inStock");

    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (inStock === "true") where.inStock = true;
    if (inStock === "false") where.inStock = false;

    const [products, total] = await Promise.all([
      db.product.findMany({
        skip,
        take: limit,
        where,
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
          shop: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              user: {
                select: { id: true, name: true, email: true, profileImage: true },
              },
            },
          },
        },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logErrorToSentry(error, {
      endpoint: "/api/admin/products",
      method: "GET",
    });
    return NextResponse.json(
      formatAPIError(error),
      { status: 500 }
    );
  }
}
