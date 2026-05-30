/**
 * src/hooks/use-notifications.tsx
 *
 * Real-time notification hook for The Chattala.
 *
 * Architecture:
 *   1. On mount, fetches the initial notification list and unread count from
 *      GET /api/notifications (server-sourced, authoritative).
 *   2. Polls periodically as the dependency-free delivery path. The server
 *      persists notifications first, so polling is authoritative and resilient
 *      even when optional realtime providers are unavailable.
 *
 * The hook preserves the exact same return interface as the previous version
 * (notifications, unreadCount, isLoading, markAllAsRead, markAsRead, refresh)
 * so no changes are needed in dashboard-view.tsx or any other consumer.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { NotificationType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotificationActor {
  id: string;
  name: string | null;
  preferredName: string | null;
  username: string | null;
  profileImage: string | null;
}

/**
 * Client-side representation of a Notification row.
 *
 * The `description` and `contextUrl` fields are DERIVED at render time from
 * `type` + `metadata` + `actor` — they are not stored in the DB. This keeps
 * the hook backward-compatible with dashboard-view.tsx which reads
 * `n.description` and `n.contextUrl` to render the notification list.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  actor: NotificationActor | null;
  // Derived convenience fields for the existing dashboard-view.tsx renderer
  description: string;
  contextUrl: string | null;
}

interface NotificationsApiResponse {
  notifications: Omit<Notification, "description" | "contextUrl">[];
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// deriveDisplayFields
//
// Produces the human-readable `description` string and optional `contextUrl`
// for a raw DB notification row. This is purely a presentation concern and
// lives in the hook rather than the DB or API layer.
// ---------------------------------------------------------------------------
function deriveDisplayFields(
  n: Omit<Notification, "description" | "contextUrl">
): { description: string; contextUrl: string | null } {
  const actorName =
    n.actor?.preferredName ?? n.actor?.name ?? "Someone";
  const meta = n.metadata as Record<string, string>;

  switch (n.type) {
    case NotificationType.POST_REACTION:
      return {
        description: `${actorName} reacted ${meta.emoji ?? ""} to your post${meta.postPreview ? `: "${meta.postPreview}"` : ""}`,
        contextUrl: n.entityId ? `/community` : null,
      };
    case NotificationType.NEW_COMMENT:
      return {
        description: `${actorName} commented on your post${meta.commentPreview ? `: "${meta.commentPreview}"` : ""}`,
        contextUrl: n.entityId ? `/community` : null,
      };
    case NotificationType.COMMENT_REPLY:
      return {
        description: `${actorName} replied to your comment`,
        contextUrl: n.entityId ? `/community` : null,
      };
    case NotificationType.POST_FLAGGED:
      return {
        description: `Your post was flagged by a moderator`,
        contextUrl: null,
      };
    case NotificationType.NEIGHBOR_REQUEST:
      return {
        description: `${actorName} sent you a neighbour request`,
        contextUrl: `/neighbours`,
      };
    case NotificationType.NEIGHBOR_ACCEPTED:
      return {
        description: `${actorName} accepted your neighbour request`,
        contextUrl: `/neighbours`,
      };
    case NotificationType.NEW_ORDER:
      return {
        description: `New order received${meta.itemCount ? ` (${meta.itemCount} item${Number(meta.itemCount) !== 1 ? "s" : ""})` : ""}`,
        contextUrl: `/seller`,
      };
    case NotificationType.ORDER_UPDATED:
      return {
        description: `Order status updated: ${meta.oldStatus ?? ""} → ${meta.newStatus ?? ""}`,
        contextUrl: `/shops`,
      };
    case NotificationType.SHOP_VERIFIED:
      return {
        description:
          meta.approved === "true"
            ? `Your shop has been approved! ✓`
            : `Your shop application was not approved${meta.reason ? `: ${meta.reason}` : ""}.`,
        contextUrl: `/seller`,
      };
    case NotificationType.NEW_PRODUCT_REVIEW:
      return {
        description: `${actorName} left a review on your product`,
        contextUrl: `/seller`,
      };
    case NotificationType.SERVICE_BOOKED:
      return {
        description: `${actorName} booked your expert service`,
        contextUrl: `/expert`,
      };
    case NotificationType.SERVICE_UPDATED:
      return {
        description: `Your service booking status changed: ${meta.newStatus ?? ""}`,
        contextUrl: `/expert`,
      };
    case NotificationType.SERVICE_VERIFIED:
      return {
        description:
          meta.approved === "true"
            ? `Your expert profile has been approved! ✓`
            : `Your expert profile was not approved${meta.reason ? `: ${meta.reason}` : ""}.`,
        contextUrl: `/expert`,
      };
    case NotificationType.SYSTEM_ALERT:
    case NotificationType.MODERATION_ACTION:
    default:
      return {
        description: (meta.message as string) ?? "You have a new notification",
        contextUrl: null,
      };
  }
}

// ---------------------------------------------------------------------------
// enrichNotification
//
// Takes a raw DB row and returns a fully enriched Notification with derived
// `description` and `contextUrl` fields ready for the UI.
// ---------------------------------------------------------------------------
function enrichNotification(
  raw: Omit<Notification, "description" | "contextUrl">
): Notification {
  return { ...raw, ...deriveDisplayFields(raw) };
}

// ---------------------------------------------------------------------------
// useNotifications
// ---------------------------------------------------------------------------

export function useNotifications(pollingIntervalMs = 60_000) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------------------------
  // fetchNotifications — initial load + polling fallback
  // -------------------------------------------------------------------------
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.get<NotificationsApiResponse>("/api/notifications");
      setNotifications((data.notifications ?? []).map(enrichNotification));
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      console.error("[useNotifications] Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch + polling fallback (catches missed realtime events without
  // hammering the server).
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollingIntervalMs]);

  // -------------------------------------------------------------------------
  // Realtime note
  // -------------------------------------------------------------------------
  // The previous implementation dynamically imported a realtime client SDK, but that
  // package was not represented in the lockfile and blocked deterministic
  // installs in restricted environments. Polling remains the authoritative,
  // dependency-free path because notifications are durably stored server-side
  // before any best-effort realtime trigger is attempted.

  // -------------------------------------------------------------------------
  // markAllAsRead — optimistic, reverts on failure
  // -------------------------------------------------------------------------
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const previousNotifications = notifications;
    const previousCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.patch("/api/notifications");
    } catch (error) {
      console.error("[useNotifications] Failed to mark all as read:", error);
      // Revert optimistic update on failure.
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    }
  };

  // -------------------------------------------------------------------------
  // markAsRead — optimistic, reverts on failure
  // -------------------------------------------------------------------------
  const markAsRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return; // already read, skip network call

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error("[useNotifications] Failed to mark as read:", error);
      // Revert optimistic update on failure.
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    refresh: fetchNotifications,
  };
}
