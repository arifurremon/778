# Runbook: Pusher Down

**Severity:** P2 — realtime features degraded  
**Owner:** On-call engineer  
**Last updated:** 2026-03-12

## Symptoms

- Live notifications and message delivery delayed or absent
- `/admin/health` Pusher config check fails
- Client console: Pusher connection errors
- Core CRUD and HTTP APIs still work

## Immediate actions (0–15 min)

1. Check [Pusher Status](https://status.pusher.com/)
2. Verify env vars: `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`
3. Confirm auth endpoint `/api/pusher-auth` returns 200 for logged-in user
4. Notify users that messages may be delayed

## Mitigation

| Step | Action |
|------|--------|
| 1 | Rotate Pusher secret if auth errors spike |
| 2 | Switch cluster in dashboard if regional outage |
| 3 | Fall back to polling notifications (existing HTTP refresh) |
| 4 | Disable realtime banner in UI if prolonged outage |

## Recovery verification

- Send test message between two staging users
- Confirm notification appears without page refresh
- Monitor Sentry for Pusher auth failures → zero

## Post-incident

- Document downtime on status page
- Review channel authorization rules in `/api/pusher-auth`
