import type { Order, OrderStatus, Product } from "@/hooks/use-business";

export type ApiOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface ApiSellerOrder {
  id: string;
  shopId: string;
  productId: string;
  buyerId: string;
  buyerName: string | null;
  buyerPhone: string | null;
  status: ApiOrderStatus;
  quantity: number;
  totalPrice: number;
  address: string;
  note?: string | null;
  createdAt: string;
  product: {
    name: string;
    images: string[];
  };
  buyer?: {
    email: string;
  };
}

export interface ApiSellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  inStock: boolean;
  category: string;
  createdAt: string;
}

export interface ApiSellerShop {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  isVerified: boolean;
  rating: number;
  trustScore: number;
}

const UI_TO_API_STATUS: Record<OrderStatus, ApiOrderStatus> = {
  Pending: "PENDING",
  Processing: "PROCESSING",
  Sent: "SHIPPED",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
};

const API_TO_UI_STATUS: Record<string, OrderStatus> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  CONFIRMED: "Processing",
  SHIPPED: "Sent",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Cancelled",
};

export function mapUiOrderStatusToApi(status: OrderStatus): ApiOrderStatus {
  return UI_TO_API_STATUS[status];
}

export function mapApiOrderStatusToUi(status: string): OrderStatus {
  return API_TO_UI_STATUS[status] ?? "Pending";
}

export function mapApiSellerOrder(order: ApiSellerOrder): Order {
  return {
    id: order.id,
    shopId: order.shopId,
    productId: order.productId,
    productName: order.product.name,
    buyerName: order.buyerName ?? "Customer",
    buyerEmail: order.buyer?.email ?? "",
    phone: order.buyerPhone ?? "",
    address: order.address,
    price: order.totalPrice,
    status: mapApiOrderStatusToUi(order.status),
    timestamp: new Date(order.createdAt).toLocaleString(),
  };
}

export function mapApiSellerProduct(product: ApiSellerProduct, shopId: string): Product {
  return {
    id: product.id,
    shopId,
    name: product.name,
    description: product.description,
    price: product.price,
    deliveryCharge: "৳50",
    images: product.images,
    inStock: product.inStock,
    category: product.category,
  };
}

export function formatOrderAmount(price: number): string {
  return `৳${price.toLocaleString("en-BD")}`;
}
