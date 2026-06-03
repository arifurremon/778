
"use client";

import { api } from "@/lib/api";
import {
  mapApiSellerOrder,
  mapApiSellerProduct,
  mapUiOrderStatusToApi,
  type ApiSellerOrder,
  type ApiSellerProduct,
  type ApiSellerShop,
} from "@/lib/business-utils";
import { mapApiProductReview, type ApiProductReview } from "@/lib/review-utils";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export type OrderStatus = "Pending" | "Processing" | "Sent" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  phone: string;
  address: string;
  price: number;
  status: OrderStatus;
  timestamp: string;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  deliveryCharge: string;
  images: string[];
  inStock?: boolean;
  category?: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  timestamp: string;
  isVerified: boolean;
  reply?: string;
}

interface BusinessContextType {
  shop: ApiSellerShop | null;
  shopId: string | null;
  orders: Order[];
  products: Product[];
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  addOrder: (order: Omit<Order, "id" | "status" | "timestamp">) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  addReview: (review: Omit<Review, "id" | "timestamp" | "isVerified">) => Promise<void>;
  addReply: (reviewId: string, reply: string) => Promise<void>;
  initializeBusiness: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [shop, setShop] = useState<ApiSellerShop | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  const loadBusinessData = useCallback(async (force = false) => {
    if (fetchPromiseRef.current && !force) {
      return fetchPromiseRef.current;
    }

    const fetchTask = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sellerShop = await api.get<ApiSellerShop>("/api/shops/me");
        setShop(sellerShop);
        setShopId(sellerShop.id);

        const [ordersResponse, productsResponse, reviewsResponse] = await Promise.all([
          api.get<{ orders: ApiSellerOrder[] }>("/api/orders/seller?limit=50"),
          api.get<{ products: ApiSellerProduct[] }>(`/api/shops/${sellerShop.id}/products`),
          api.get<{ reviews: ApiProductReview[] }>("/api/reviews/seller?limit=50"),
        ]);

        setOrders(ordersResponse.orders.map(mapApiSellerOrder));
        setProducts(
          productsResponse.products.map((product) =>
            mapApiSellerProduct(product, sellerShop.id)
          )
        );
        setReviews(reviewsResponse.reviews.map(mapApiProductReview));
      } catch (err) {
        setShop(null);
        setShopId(null);
        setOrders([]);
        setProducts([]);
        setReviews([]);
        setError(err instanceof Error ? err.message : "Failed to load seller data.");
      } finally {
        setIsLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchTask;
    return fetchTask;
  }, []);

  const initializeBusiness = useCallback(async () => {
    await loadBusinessData(false);
  }, [loadBusinessData]);

  const refreshBusiness = useCallback(async () => {
    await loadBusinessData(true);
  }, [loadBusinessData]);

  const addOrder = async (orderData: Omit<Order, "id" | "status" | "timestamp">) => {
    await api.post("/api/orders", {
      shopId: orderData.shopId,
      productId: orderData.productId,
      phone: orderData.phone,
      address: orderData.address,
    });
    if (shopId) {
      await refreshBusiness();
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const previousOrders = orders;
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );

    try {
      await api.patch(`/api/orders/${orderId}`, {
        status: mapUiOrderStatusToApi(status),
      });
    } catch (error) {
      setOrders(previousOrders);
      throw error;
    }
  };

  const addProduct = async (productData: Omit<Product, "id">) => {
    const activeShopId = productData.shopId || shopId;
    if (!activeShopId) {
      throw new Error("No shop found for this seller.");
    }

    const created = await api.post<ApiSellerProduct>(
      `/api/shops/${activeShopId}/products`,
      {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images,
        category: productData.category ?? shop?.category ?? "General",
      }
    );

    setProducts((prev) => [
      mapApiSellerProduct(created, activeShopId),
      ...prev,
    ]);
  };

  const addReview = async (reviewData: Omit<Review, "id" | "timestamp" | "isVerified">) => {
    if (!shopId) {
      throw new Error("No shop found for this seller.");
    }

    const created = await api.post<ApiProductReview>(`/api/shops/${shopId}/reviews`, {
      productId: reviewData.productId,
      rating: reviewData.rating,
      comment: reviewData.comment,
    });

    setReviews((prev) => [mapApiProductReview(created), ...prev]);
  };

  const addReply = async (reviewId: string, reply: string) => {
    const response = await api.patch<{ review: ApiProductReview }>(`/api/reviews/${reviewId}`, {
      reply,
    });

    const mapped = mapApiProductReview(response.review);
    setReviews((prev) =>
      prev.map((review) => (review.id === reviewId ? mapped : review))
    );
  };

  return (
    <BusinessContext.Provider
      value={{
        shop,
        shopId,
        orders,
        products,
        reviews,
        isLoading,
        error,
        addOrder,
        updateOrderStatus,
        addProduct,
        addReview,
        addReply,
        initializeBusiness,
        refreshBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within BusinessProvider");
  return context;
};
