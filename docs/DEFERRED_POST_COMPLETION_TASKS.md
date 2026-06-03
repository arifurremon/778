# Deferred Tasks — Run After All Phases Complete

> **Purpose:** Operational tasks that require production/staging console access, secrets, or hosting config.  
> **Do not block** Phase 7–9 development. Execute in the **final pre-launch window** (1–2 weeks before production).

---

## Phase 6 — API Platform (staging/production ops)

| # | Task | Where | Notes |
|---|------|-------|-------|
| 6-A | Set `CRON_SECRET` | Vercel → Environment Variables (staging + prod) | Generate: `openssl rand -base64 32` |
| 6-B | Schedule webhook retry cron | Vercel Cron or external scheduler | `GET /api/cron/webhook-retry` every 5 min with `Authorization: Bearer $CRON_SECRET` |
| 6-C | Verify webhook test endpoint | Staging | `POST /api/webhooks/test` after creating a subscription with `ping` event |
| 6-D | Verify idempotency in staging | Staging | Duplicate `POST /api/orders` with same `Idempotency-Key` → same resource, `Idempotent-Replayed: true` |
| 6-E | OpenAPI live check | Staging/prod | `GET /api/openapi.json`, browse `/api/docs` |

### Example cron test (after deploy)

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR-STAGING-URL/api/cron/webhook-retry
# Expected: {"success":true,"processed":0} (or N pending)
```

### Optional `vercel.json` cron snippet

```json
{
  "crons": [
    { "path": "/api/cron/webhook-retry", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/data-retention", "schedule": "0 3 * * *" }
  ]
}
```

---

## Phase 4 — DR / Reliability (requires Neon Console + hosting panel)

| # | Task | Guide |
|---|------|-------|
| 4-A | Neon PITR restore drill → staging branch | `docs/runbooks/DR_DRILL_GUIDE_BN.md` |
| 4-B | Hosting rollback drill (record RTO/RPO) | `docs/runbooks/DR_DRILL_GUIDE_BN.md` |
| 4-C | Fill `LAUNCH_READINESS_REPORT.md` RTO/RPO tables | After drills complete |
| 4-D | External uptime monitor on `/api/health` | UptimeRobot / Better Stack |

---

## Phase 5 — Data (optional CI secret)

| # | Task | Notes |
|---|------|-------|
| 5-A | Add GitHub secret `STAGING_DATABASE_URL` | Enables `.github/workflows/backup-verify.yml` weekly job |

---

## Phase 1 — GitHub Settings (manual)

| # | Task | Doc |
|---|------|-----|
| 1-A | Branch protection: require CI + E2E before merge | `docs/BRANCH_STRATEGY.md` |

---

## Phase 8 — Enterprise Operations (console setup)

- [ ] Create `staging` git branch + Vercel staging project — `docs/STAGING_ENVIRONMENT.md`
- [ ] GitHub secrets: `STAGING_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_STAGING_PROJECT_ID`, `VERCEL_PROJECT_ID`
- [ ] GitHub `production` environment with required reviewers
- [ ] Fill secondary on-call name in `docs/ON_CALL_ROTATION.md`
- [ ] Two-person runbook training sign-off in `LAUNCH_READINESS_REPORT.md`
- [ ] Optional: `terraform apply` when Neon/Upstash API keys ready — `infra/terraform/`

---

## Phase 7 — Async / Inngest (staging/production ops)

- [ ] Set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` in Vercel (staging + prod)
- [ ] Sync Inngest app with `https://YOUR-URL/api/inngest`
- [ ] Enable `FEATURE_ASYNC_MAIL=true` in production after Inngest verified
- [ ] Run k6 against staging URL: `npm run loadtest:k6 -- -e BASE_URL=https://...`
- [ ] Record k6 p95/error rate in `LAUNCH_READINESS_REPORT.md`
- [ ] Confirm Inngest dashboard shows mail/export/retention job success rate > 99%

---

## Sign-off checklist (final week)

- [ ] All items above checked off per environment (staging → prod)
- [ ] `LAUNCH_READINESS_REPORT.md` updated
- [ ] `docs/ENTERPRISE_ROADMAP.md` exit criteria verified
- [ ] On-call contact filled in runbooks

**Last updated:** Phase 8 (enterprise ops docs + CI workflows)
