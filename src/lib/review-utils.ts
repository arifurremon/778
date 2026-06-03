import type { Review } from "@/hooks/use-business";

export interface ApiProductReview {
  id: string;
  shopId: string;
  scope: string;
  productId: string | null;
  buyerId: string;
  orderId: string | null;
  rating: number;
  comment: string;
  reply: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  buyer?: {
    id: string;
    name: string | null;
    preferredName: string | null;
    profileImage: string | null;
    email?: string;
  };
}

export const reviewSelect = {
  id: true,
  shopId: true,
  scope: true,
  productId: true,
  buyerId: true,
  orderId: true,
  rating: true,
  comment: true,
  reply: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  buyer: {
    select: {
      id: true,
      name: true,
      preferredName: true,
      profileImage: true,
      email: true,
    },
  },
} as const;

export function normalizeReviewScope(productId: string): string {
  return productId === "general" ? "general" : productId;
}

export function serializeProductReview<T extends {
  createdAt: Date;
  updatedAt: Date;
}>(review: T) {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export function mapApiProductReview(review: ApiProductReview): Review {
  const userName =
    review.buyer?.preferredName ||
    review.buyer?.name ||
    "Customer";

  return {
    id: review.id,
    productId: review.scope,
    userName,
    userEmail: review.buyer?.email ?? "",
    rating: review.rating,
    comment: review.comment,
    timestamp: new Date(review.createdAt).toLocaleString(),
    isVerified: review.isVerified,
    reply: review.reply ?? undefined,
  };
}

export async function recalculateShopRating(
  tx: {
    productReview: {
      aggregate: (args: {
        where: { shopId: string };
        _avg: { rating: true };
      }) => Promise<{ _avg: { rating: number | null } }>;
    };
    shop: {
      update: (args: {
        where: { id: string };
        data: { rating: number };
      }) => Promise<unknown>;
    };
  },
  shopId: string
) {
  const aggregate = await tx.productReview.aggregate({
    where: { shopId },
    _avg: { rating: true },
  });

  const rating = aggregate._avg.rating ?? 5;

  await tx.shop.update({
    where: { id: shopId },
    data: { rating: Math.round(rating * 10) / 10 },
  });
}
