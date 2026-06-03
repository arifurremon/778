"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import {
  mapApiActivityLog,
  type ActivityItem,
  type ActivityTab,
  type ApiActivityLog,
} from "@/lib/activity-utils";

interface ActivityApiResponse {
  activities: ApiActivityLog[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  nextPage: number | null;
}

export function useActivity(initialTab: ActivityTab = "all") {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (tab: ActivityTab = activeTab) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<ActivityApiResponse>(
        `/api/activity?tab=${encodeURIComponent(tab)}&limit=50`
      );
      setActivities(data.activities.map(mapApiActivityLog));
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setActivities([]);
      setError(err instanceof Error ? err.message : "Failed to load activity.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, userId]);

  useEffect(() => {
    void fetchActivities(activeTab);
  }, [activeTab, fetchActivities]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const previous = activities;
    const previousCount = unreadCount;

    setActivities((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await api.patch("/api/activity");
    } catch (err) {
      setActivities(previous);
      setUnreadCount(previousCount);
      throw err;
    }
  };

  const markAsRead = async (id: string) => {
    const target = activities.find((item) => item.id === id);
    if (!target || target.isRead) return;

    setActivities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/api/activity/${id}/read`);
    } catch (err) {
      setActivities((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: false } : item))
      );
      setUnreadCount((prev) => prev + 1);
      throw err;
    }
  };

  return {
    activities,
    activeTab,
    setActiveTab,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    markAsRead,
    refresh: () => fetchActivities(activeTab),
  };
}
