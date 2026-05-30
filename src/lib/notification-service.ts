/**
 * src/lib/notification-service.ts
 *
 * Centralised, strongly-typed function for creating and delivering
 * notifications across every module of The Chattala.
 *
 * Architecture:
 *   1. Write to the Notification table first (source of truth).
 *   2. Attempt a Pusher real-time event delivery on the user's private channel.
 *   3. Pusher failure is caught and logged — it NEVER throws or rolls back the
 *      DB write. The user will see the notification on their next page visit
 *      even if real-time delivery failed (graceful degradation).
 *
 * Usage:
 *   import { sendNotification } from "@/lib/notification-service";
 *
 *   // When User B reacts to User A's post:
 *   await sendNotification({
 *     userId:     post.authorId,          // recipient
 *     actorId:    session.user.id,        // who triggered it
 *     type:       NotificationType.POST_REACTION,
 *     entityType: "Post",
 *     entityId:   post.id,
 *     metadata:   { emoji: "\u{1F44D}", postPreview: post.content.slice(0, 80) },
 *   });
 *
 *   // When the system sends a moderation alert (no actor):
 *   await sendNotification({
 *     userId:     targetUser.id,
 *     type:       NotificationType.SYSTEM_ALERT,
 *     metadata:   { message: "Your post was removed for violating community guidelines.", severity: "HIGH" },
 *   });
 */

import { db } from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { logErrorToSentry } from "@/lib/error-handler";
import { NotificationType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Parameters for sendNotification.
 * All fields other than userId and type are optional to accommodate both
 * human-triggered events (with actorId + entityType/Id) and system-generated
 * events (no actor, no entity).
 */
export interface SendNotificationParams {
  /** The user who will receive this notification. */
  userId: string;

  /** The user who caused the event. Omit for SYSTEM_ALERT / MODERATION_ACTION. */
  actorId?: string;

  /** The event classification — drives rendering and filtering on the client. */
  type: NotificationType;

  /**
   * Logical name of the source table, e.g. "Post", "Comment", "Order",
   * "NeighbourConnection", "Shop", "ExpertService".
   * Omit for notifications with no specific entity reference.
   */
  entityType?: string;

  /** UUID primary key of the referenced row in entityType's table. */
  entityId?: string;

  /**
   * Type-specific contextual payload for UI rendering.
   * Examples:
   *   POST_REACTION:  { emoji: "\u{1F44D}", postPreview: "..." }
   *   ORDER_UPDATED:  { oldStatus: "PENDING", newStatus: "CONFIRMED" }
   *   SYSTEM_ALERT:   { message: "...", severity: "HIGH" | "LOW" }
   */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// sendNotification
// ---------------------------------------------------------------------------

export async function sendNotification(
  params: SendNotificationParams
): Promise<void> {
  const {
    userId,
    actorId,
    type,
    entityType,
    entityId,
    metadata = {},
  } = params;

  // Step 1 — Persist the notification. This is the authoritative write.
  // If this fails, we throw immediately (the caller's try-catch handles it).
  // A notification that wasn't persisted should not be delivered.
  const notification = await db.notification.create({
    data: {
      userId,
      actorId: actorId ?? null,
      type,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      metadata,
    },
    // Select the fields the client needs to render the notification immediately
    // without a follow-up fetch — the Pusher payload IS the notification record.
    select: {
      id: true,
      type: true,
      entityType: true,
      entityId: true,
      metadata: true,
      isRead: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          username: true,
          profileImage: true,
        },
      },
    },
  });

  // Step 2 — Attempt real-time delivery via Pusher.
  // This is a best-effort operation: third-party failures (network, Pusher
  // outage, misconfigured credentials) are caught here and logged to Sentry
  // but DO NOT bubble up. The DB write in Step 1 is the durable record;
  // the user will see the notification on their next GET /api/notifications
  // even if this step fails.
  try {
    // Channel naming convention: private-user-{userId}
    // The "private-" prefix activates Pusher's server-side channel
    // authentication, ensuring users can only subscribe to their own channel.
    // Phase 3 will implement the /api/pusher/auth endpoint for this handshake.
    const channel = `private-user-${userId}`;
    const event = "new-notification";

    await pusher?.trigger(channel, event, notification);
  } catch (pusherError) {
    // Log to Sentry for observability but do not re-throw.
    logErrorToSentry(pusherError, {
      context: "sendNotification:pusherTrigger",
      notificationId: notification.id,
      userId,
      type,
    });
  }
}

// ---------------------------------------------------------------------------
// Re-export NotificationType for convenience so call sites only need one import
// ---------------------------------------------------------------------------
export { NotificationType };
