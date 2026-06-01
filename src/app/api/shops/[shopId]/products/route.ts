import { logErrorToSentry } from "@/lib/error-handler";
import { requireActiveMutation } from "@/lib/session-guards";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ shopId: string }> };

// ---------------------------------------------------------------------------
// Helper — verify requester owns the shop
// ---------------------------------------------------------------------------
async function verifyOwner(
  shopId: string,
  userId: string
): Promise<{ owned: true; userId: string } | { owned: false; response: NextResponse }> {
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { userId: true },
  });

  if (!shop) {
    return {
      owned: false,
      response: NextResponse.json({ error: "Shop not found." }, { status: 404 }),
    };
  }

  if (shop.userId !== userId) {
    return {
      owned: false,
      response: NextResponse.json(
        { error: "Forbidden. You do not own this shop." },
        { status: 403 }
      ),
    };
  }

  return { owned: true, userId: shop.userId };
}

// ---------------------------------------------------------------------------
// GET /api/shops/[shopId]/products  — list products, optional ?inStock filter
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { shopId } = await params;

    const shopExists = await db.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });
    if (!shopExists) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    const inStockParam = req.nextUrl.searchParams.get("inStock");
    const inStockFilter =
      inStockParam === "true" ? true : inStockParam === "false" ? false : undefined;

    const products = await db.product.findMany({
      where: {
        shopId,
        ...(inStockFilter !== undefined ? { inStock: inStockFilter } : {}),
      },
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
    });

    const formattedProducts = products.map(p => ({
      ...p,
      price: p.price.toNumber(),
      originalPrice: p.originalPrice ? p.originalPrice.toNumber() : null,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    logErrorToSentry(error, { route: "[GET /api/shops/[shopId]/products]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/shops/[shopId]/products  — add product (owner only)
// ---------------------------------------------------------------------------
const createProductSchema = z.object({
  name:          z.string().min(2, "Product name must be at least 2 characters."),
  description:   z.string().min(5, "Description must be at least 5 characters."),
  price:         z.number().positive("Price must be a positive number."),
  originalPrice: z.number().optional(),
  images:        z.array(z.string().url("Each image must be a valid URL.")).min(1, "At least one image is required."),
  category:      z.string().min(1, "Category is required."),
});

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const active = await requireActiveMutation(req);
    if (active.error) return active.error;
    const { session } = active;

    const { shopId } = await params;
    const ownership = await verifyOwner(shopId, session.user.id);
    if (!ownership.owned) return ownership.response;

    const body: unknown = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed." },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        shopId,
        ...parsed.data,
      },
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
    });

    const formattedProduct = {
      ...product,
      price: product.price.toNumber(),
      originalPrice: product.originalPrice ? product.originalPrice.toNumber() : null,
    };

    return NextResponse.json(formattedProduct, { status: 201 });
  } catch (error) {
    logErrorToSentry(error, { route: "[POST /api/shops/[shopId]/products]" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
