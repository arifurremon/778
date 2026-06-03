# Sentry Alert Rules — Phase 4

Configure these alerts in **Sentry → Alerts → Create Alert** for project `javascript-nextjs`.

Environment filter: `production` (and optionally `staging` for pre-production validation).

---

## Alert 1 — Error rate > 1%

| Field | Value |
|-------|-------|
| **Name** | `[Prod] Error rate > 1%` |
| **Dataset** | Errors |
| **Filter** | `environment:production` |
| **Condition** | Percent of sessions / events with error > **1%** over **5 minutes** |
| **Action** | Email + Slack `#incidents` |
| **Priority** | High |

**Staging test:** Deploy a staging-only `/api/debug/sentry-test` route (do not enable in prod) or use Sentry "Send test alert".

---

## Alert 2 — p95 transaction latency > 2s

| Field | Value |
|-------|-------|
| **Name** | `[Prod] p95 latency > 2s` |
| **Dataset** | Transactions |
| **Filter** | `environment:production` |
| **Condition** | p95 transaction duration > **2000 ms** over **10 minutes** |
| **Action** | Email + Slack `#incidents` |
| **Priority** | Medium |

Custom spans to watch: `commerce.order`, `commerce.booking`, `admin.mutation`.

Sampling: `tracesSampleRate=0.1` in production (`src/lib/observability/sentry-options.ts`).

---

## Alert 3 — Health check failure

| Field | Value |
|-------|-------|
| **Name** | `[Prod] Health check failing` |
| **Type** | Uptime / Cron (Better Stack or Sentry Cron Monitors) |
| **URL** | `GET https://thechattala.com/api/health` |
| **Expect** | HTTP **200** and JSON `"status":"healthy"` or `"degraded"` |
| **Fail when** | HTTP **503** or timeout > **10 s** |
| **Frequency** | Every **1 minute** from 3 regions |
| **Action** | PagerDuty / Slack `#incidents` |
| **Priority** | Critical |

**Note:** Database failure returns 503. Redis-only failure returns 200 with `"status":"degraded"` — configure Better Stack JSON assertion separately if needed.

---

## Verification checklist (staging)

- [ ] Trigger test error → Alert 1 fires within 5 min
- [ ] Artificial slow transaction span → Alert 2 fires
- [ ] Block DB in staging → Alert 3 fires on `/api/health` 503
- [ ] Document alert IDs and owners in this file after creation

---

## Related metrics (in-app)

In-process histograms via `src/lib/observability/metrics.ts`:

- Request latency p50/p95/p99
- Error rate counter
- DB query duration p95

These complement Sentry; export to Grafana later if needed (Phase 5+).
