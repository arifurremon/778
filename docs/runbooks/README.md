# On-Call Runbooks

Step-by-step incident response for The Chattala production dependencies.

| Runbook | Trigger | Severity |
|---------|---------|----------|
| [Redis Down](./REDIS_DOWN.md) | Cache/rate-limit failures, elevated latency | P2 |
| [Neon Down](./NEON_DOWN.md) | DB errors, `/api/health` 503 | P1 |
| [Pusher Down](./PUSHER_DOWN.md) | Realtime notifications/messages fail | P2 |
| [SMTP Down](./SMTP_DOWN.md) | Email verification/reset failures | P2 |

## Escalation

1. Acknowledge alert in Sentry / Better Stack within **15 minutes**
2. Post in `#incidents` Slack channel with severity + owner
3. Update public status page if user-facing impact > 5 minutes
4. Use [Incident Response template](../archive/pre-launch/INCIDENT_RESPONSE.md) for P1/P2 (archived template)
5. File post-incident note in `LAUNCH_READINESS_REPORT.md` within 24 hours

**On-call rotation:** [ON_CALL_ROTATION.md](../archive/pre-launch/ON_CALL_ROTATION.md) (archived template)

## Useful links

- Public health probe: `GET /api/health`
- Admin diagnostics: `/admin/health` (admin session required)
- Sentry: organization `inievo-technologies`, project `javascript-nextjs`
- Alert definitions: [`../observability/SENTRY_ALERTS.md`](../observability/SENTRY_ALERTS.md)
