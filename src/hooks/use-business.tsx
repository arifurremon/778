
"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type OrderStatus = 'Pending' | 'Processing' | 'Sent' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  phone: string;
  address: string;
  price: string;
  status: OrderStatus;
  timestamp: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: string;
  deliveryCharge: string;
  images: string[];
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
  orders: Order[];
  products: Product[];
  reviews: Review[];
  addOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addReview: (review: Omit<Review, 'id' | 'timestamp' | 'isVerified'>) => void;
  addReply: (reviewId: string, reply: string) => void;
  initializeBusiness: () => void;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const hasFetchedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const initializeBusiness = useCallback(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    const savedOrders = localStorage.getItem("chattala_orders");
    const savedProducts = localStorage.getItem("chattala_products");
    const savedReviews = localStorage.getItem("chattala_reviews");

    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("chattala_orders", JSON.stringify(orders));
  }, [orders, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("chattala_products", JSON.stringify(products));
  }, [products, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("chattala_reviews", JSON.stringify(reviews));
  }, [reviews, isHydrated]);

  const addOrder = (orderData: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Pending',
      timestamp: new Date().toLocaleString(),
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Math.random().toString(36).substr(2, 9)}`,
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'timestamp' | 'isVerified'>) => {
    const hasOrder = orders.some(o =>
      o.productId === reviewData.productId &&
      o.buyerEmail === reviewData.userEmail &&
      o.status === 'Delivered'
    );

    const newReview: Review = {
      ...reviewData,
      id: `rev-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleString(),
      isVerified: hasOrder,
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const addReply = (reviewId: string, reply: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply } : r));
  };

  return (
    <BusinessContext.Provider value={{
      orders,
      products,
      reviews,
      addOrder,
      updateOrderStatus,
      addProduct,
      addReview,
      addReply,
      initializeBusiness,
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within BusinessProvider");
  return context;
};
