# ADR 004: Inngest for Async Job Queue

**Status:** Accepted  
**Date:** 2026-03-13 (Phase 7 implementation; ADR Phase 8)

## Context

Phase 7 required moving SMTP, bulk admin messaging, GDPR export generation, and retention jobs off the HTTP request path. The stack runs on **Vercel serverless** with **Upstash Redis REST** (not TCP Redis).

## Decision

Adopt **Inngest** as the background job platform:

| Job | Event / trigger |
|-----|-----------------|
| Email send | `mail/send` |
| Admin bulk message | `admin/bulk-message` |
| User data export | `user/export.generate` |
| Data retention | Cron `0 3 * * *` + manual event |

- Serve handler: `GET/POST /api/inngest`
- Direct SMTP in `src/lib/mail-direct.ts`; public `@/lib/mail` enqueues when `FEATURE_ASYNC_MAIL=true`
- Feature flags in `src/lib/feature-flags.ts` for gradual rollout

## Consequences

**Positive**

- Native Next.js / Vercel integration; no long-lived worker process.
- Built-in retries, steps, cron, dashboard.
- Works alongside existing HTTP cron endpoints (`CRON_SECRET`) during migration.

**Negative**

- Vendor dependency (Inngest Cloud or self-host).
- Requires `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` per environment.
- Local dev needs Inngest Dev Server or sync fallback (sync when flags off).

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| BullMQ + Redis | Requires TCP Redis + persistent workers — poor fit for Vercel |
| Vercel Cron only | No step retries/dashboard for complex fan-out |
| DB polling queue (webhooks pattern) | Already used for webhooks; insufficient for SMTP fan-out |

## References

- `src/inngest/`, `docs/CAPACITY_PLANNING.md`, Phase 7 roadmap
