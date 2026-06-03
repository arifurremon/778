# ADR 003: Notification Dual-Path (DB + Pusher)

**Status:** Accepted  
**Date:** 2026-03-12 (documented Phase 8)

## Context

Users need in-app notifications with near-real-time delivery. Pusher alone is ephemeral; DB alone feels slow without websocket push.

## Decision

**Dual-path architecture** in `src/lib/notification-service.ts`:

1. **Authoritative write:** `db.notification.create()` — always first.
2. **Best-effort realtime:** `pusher.trigger("private-user-{id}", "new-notification", payload)`.
3. Pusher failures are caught, logged to Sentry, **never roll back** the DB write.
4. Client falls back to polling `/api/notifications` on reconnect.

Email notifications use a separate optional path (`sendNotificationEmailIfAllowed`) respecting privacy settings.

## Consequences

**Positive**

- Users always see notifications after refresh even if Pusher is down.
- Clear source of truth for unread counts and history.
- Graceful degradation aligned with Phase 9 chaos testing goals.

**Negative**

- Two systems to monitor (Pusher + DB).
- Possible duplicate awareness (push + poll) — client deduplicates by notification ID.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Pusher only | No durable history; data loss on disconnect |
| DB only + polling | Poor UX for realtime product |
| SSE self-hosted | Operational cost vs managed Pusher |

## References

- `src/lib/notification-service.ts`, `docs/runbooks/PUSHER_DOWN.md`
