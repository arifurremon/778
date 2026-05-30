/**
 * src/hooks/use-notifications.tsx
 *
 * Real-time notification hook for The Chattala.
 *
 * Architecture:
 *   1. On mount, fetches the initial notification list and unread count from
 *      GET /api/notifications (server-sourced, authoritative).
 *   2. Initialises a Pusher client (pusher-js) and subscribes to the user's
 *      private channel: "private-user-{userId}".
 *      - The Pusher client calls POST /api/pusher/auth to complete the
 *        private-channel handshake before the subscription is allowed.
 *   3. When a "new-notification" event arrives on the channel, prepends it to
 *      local state and increments the unread count — zero page refresh needed.
 *   4. Falls back gracefully if NEXT_PUBLIC_PUSHER_KEY is not set (e.g. local
 *      dev without Pusher credentials): the initial DB fetch still works and
 *      the hook returns the same interface.
 *   5. On unmount, unsubscribes from the channel and disconnects the client
 *      to avoid memory leaks and zombie WebSocket connections.
 *
 * The hook preserves the exact same return interface as the previous version
 * (notifications, unreadCount, isLoading, markAllAsRead, markAsRead, refresh)
 * so no changes are needed in dashboard-view.tsx or any other consumer.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Keep a stable ref to the Pusher channel so the cleanup effect doesn't
  // need `channel` in its dependency array (which would trigger re-subscriptions
  // on every render).
  const channelRef = useRef<import("pusher-js").Channel | null>(null);
  const pusherRef = useRef<import("pusher-js").default | null>(null);

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

  // Initial fetch + polling fallback (catches missed Pusher events during
  // brief disconnections without hammering the server).
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollingIntervalMs]);

  // -------------------------------------------------------------------------
  // Pusher real-time subscription
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    // Degrade gracefully when Pusher is not configured (local dev without
    // credentials). Polling fallback above covers this case.
    if (!pusherKey || !pusherCluster) {
      console.warn(
        "[useNotifications] NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER not set. "
        + "Real-time delivery disabled; falling back to polling."
      );
      return;
    }

    // Dynamic import keeps pusher-js out of the initial bundle for
    // unauthenticated users who never reach this hook.
    let isMounted = true;

    import("pusher-js").then((PusherModule) => {
      if (!isMounted) return; // component unmounted before import resolved

      const PusherClass = PusherModule.default;

      const client = new PusherClass(pusherKey, {
        cluster: pusherCluster,
        // Point the Pusher client at our auth endpoint for private channels.
        // This is called automatically before the subscription is allowed.
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
        },
      });

      pusherRef.current = client;

      // Subscribe to the user's private channel.
      const channel = client.subscribe(`private-user-${userId}`);
      channelRef.current = channel;

      // Bind to the event name used by sendNotification() on the server.
      channel.bind(
        "new-notification",
        (rawNotification: Omit<Notification, "description" | "contextUrl">) => {
          const enriched = enrichNotification(rawNotification);

          // Prepend to the list (newest first) without requiring a re-fetch.
          setNotifications((prev) => [enriched, ...prev]);

          // Increment the badge count.
          setUnreadCount((prev) => prev + 1);
        }
      );

      // Log connection issues in development for easier debugging.
      if (process.env.NODE_ENV === "development") {
        client.connection.bind("error", (err: unknown) => {
          console.error("[useNotifications] Pusher connection error:", err);
        });
      }
    });

    // Cleanup: unsubscribe and disconnect on unmount or userId change.
    return () => {
      isMounted = false;
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(`private-user-${userId}`);
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [userId]);

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
