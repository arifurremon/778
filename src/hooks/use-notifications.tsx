"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./use-auth";

export type ActivityType = 
  | "LIKE" 
  | "COMMENT" 
  | "SAVED" 
  | "SYSTEM" 
  | "POPULAR" 
  | "CONNECTION_REQUEST" 
  | "CONNECTION_ACCEPTED" 
  | "COMMENT_LIKE" 
  | "COMMENT_DISLIKE" 
  | "POST_DISLIKE";

export type Notification = {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  contextUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export function useNotifications(pollingIntervalMs = 15000) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<{ notifications: Notification[] }>("/api/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications?.filter(n => !n.isRead).length || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollingIntervalMs]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.patch("/api/notifications");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchNotifications(); // Revert on failure
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      fetchNotifications(); // Revert on failure
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    refresh: fetchNotifications
  };
}
