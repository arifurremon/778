# Capacity Planning — The Chattala

> **Phase 7.4** — baseline estimates for staging/production sizing.  
> Re-measure after k6 load test on staging with real traffic mix.

---

## Current architecture

| Layer | Technology | Notes |
|-------|------------|-------|
| App | Next.js 15 (Vercel/serverless) | Stateless functions, cold starts ~200–800ms |
| Database | Neon PostgreSQL (serverless) | Pooled `DATABASE_URL` for app; `DIRECT_URL` for migrations |
| Cache + rate limits | Upstash Redis REST | Versioned namespaces (`shops`, `services`, `users`, `directory`, `emergency`) |
| Background jobs | Inngest | Mail, bulk admin, export, retention |
| Real-time | Pusher Channels | Notification fan-out (best-effort) |
| Email | SMTP (Brevo/Resend) | **Never on request path** when `FEATURE_ASYNC_MAIL=true` |

---

## Estimated capacity (initial)

| Metric | Conservative target | Notes |
|--------|---------------------|-------|
| Public read RPS | **60 RPS** aggregate | Limited by Upstash `publicRead` 60/min/IP + cache hit ratio |
| Authenticated write RPS | **10–20 RPS** | Per-user rate limits (orders 5/hr, posts 10/hr) |
| Concurrent users (k6) | **100 VUs** | Phase 7 exit criteria; p95 < 2s on cached reads |
| Neon connections | **Pool size 10–20** | Neon pooler handles burst; avoid long transactions |
| Redis memory | **64–128 MB** Upstash plan | Cache TTL 600–900s; export jobs TTL 1h |

---

## DB connection pool

Prisma + Neon serverless driver uses HTTP/WebSocket — no traditional pool in app process.

**Guidelines:**

1. Use **pooled** `DATABASE_URL` for all API routes.
2. Use **direct** `DIRECT_URL` only for `prisma migrate` and CI.
3. Keep transactions short (< 500ms p95); bulk work → Inngest.
4. Admin analytics queries should use indexed aggregations (see `docs/DATA_INDEX_AUDIT.md`).

---

## Redis memory budget

| Namespace | TTL | Approx size per key |
|-----------|-----|---------------------|
| `shops` | 600s | 5–50 KB (list pages) |
| `services` | 600s | 5–50 KB |
| `users` | 900s | 1–5 KB (profile) |
| `directory` | 600s | 10–100 KB |
| `emergency` | 600s | 5–20 KB |
| `export-job:*` | 3600s | 50 KB–2 MB (user data) |

**Invalidation:** namespace epoch bump (`INCR {ns}:v`) — no key scan required.

Monitor Upstash dashboard: memory usage, evictions, command latency.

---

## Background job throughput

| Job | Concurrency | Retry |
|-----|-------------|-------|
| `mail/send` | Inngest default | 3 |
| `admin/bulk-message` | Step per user (max 100) | 2 |
| `user/export.generate` | 1 per job | 2 |
| `data-retention-cron` | Daily 03:00 UTC | 2 |

**SMTP:** Brevo free tier ~300 emails/day — bulk admin email must respect provider limits.

---

## Scaling levers (Phase 7+)

1. Increase Upstash Redis plan when cache hit ratio > 80% but latency rises.
2. Enable Inngest concurrency limits for mail burst protection.
3. Add Neon read replica for admin analytics (future).
4. Extend k6 script with authenticated booking flow after staging seed users.

---

## k6 validation

```bash
npm run loadtest:k6 -- -e BASE_URL=https://staging.example.com
```

Record results in `LAUNCH_READINESS_REPORT.md` after staging run.

**Last updated:** Phase 7 implementation
