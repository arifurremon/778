# Deferred Tasks — Run After All Phases Complete

> **Purpose:** Operational tasks that require production/staging console access, secrets, or hosting config.  
> **Status (2026-03-13):** **Phases 0–9 code complete** on `main`. **Public GO blocked** until new Vercel account deploy + checklist below.

---

## সংক্ষিপ্ত সারাংশ (BN)

| অবস্থা | বিবরণ |
|--------|--------|
| ✅ **কোড** | Phases 0–9 merged; CI green (218 tests); `npm run build` / `build:ci` / `migrate:deploy` verified |
| ⏸️ **পুরনো Vercel** | আর ব্যবহার হবে না — **নতুন Vercel account-এ fresh deploy** |
| 🔜 **পরবর্তী কাজ** | নিচের **Section A → B → C** ক্রমে (নতুন Vercel → smoke → staging → crons/Inngest → GO) |

**পরবর্তী কাজ কী হওয়া উচিত?** → [Recommended execution order](#recommended-execution-order-new-vercel--go-live)

> **June 2026 external audit cross-check:** [Section D — Audit backlog](#d--code-backlog-june-2026-audit-vs-current-main)

---

## D — Code backlog (June 2026 audit vs current `main`)

> Cross-checked against the full codebase audit report (৩ জুন ২০২৬). Phases 0–9 closed many gaps; items below are **still open in code** or **ops-only**.

### ✅ Audit findings already addressed (since audit / Phases 6–9)

| Audit item | Current state |
|------------|---------------|
| Test suite too small | **218 Vitest tests** (58 files); **39+ Playwright tests** (11 spec files) |
| No load testing config | `scripts/load-test/k6-smoke.js` + `npm run loadtest:k6` (run deferred) |
| No pentest automation | `.github/workflows/security-zap.yml` + `docs/security/PENTEST_REPORT.md` |
| No Lighthouse CI | `.github/workflows/lighthouse.yml` + `lighthouserc.cjs` |
| API platform incomplete | OpenAPI, v1 routes, idempotency, webhooks, API keys (Phase 6) |
| Admin E2E limited | `e2e/admin-moderation.spec.ts`, `e2e/booking-lifecycle.spec.ts` |
| Fresh migrate risk | Migration order fixed (`2026061010*`); `build:ci` passes on empty Postgres |
| Block on feed (partial) | `GET/POST /api/posts` filters `blockedUser` server-side |
| Enterprise ops docs | Staging/promote workflows, ADRs, on-call, scorecard |

### ✅ Critical code fixes (Phase 1 — complete `b5cc5ae`)

| # | Issue | Status |
|---|-------|--------|
| D-C1 | **Server-side block enforcement** | ✅ `src/lib/user-blocks.ts` — messages, neighbours, profile; bidirectional feed filter |
| D-C2 | **Password policy unified** | ✅ `src/lib/validation/password.ts` — 8 chars + symbol across API, UI, OpenAPI |
| D-C3 | **Logo asset optimized** | ✅ `logo-icon.png` 2.8MB → 512×512 (~45KB) |

### ✅ Phase 2 quality hardening (complete `feat/phase2`)

| # | Issue | Status |
|---|-------|--------|
| D-H1 | **Coverage gate raised** | ✅ Thresholds **47% lines / 44% stmts / 34% branches** (was 40/28); **244 tests** |
| D-H2 | **Messages API integration tests** | ✅ `messages.integration.test.ts` + block test |
| D-H3 | **Cache invalidation unit tests** | ✅ `src/__tests__/lib/cache.test.ts` (hit/miss/invalidate/ping) |
| D-H4 | **`any` cleanup (priority paths)** | ✅ Partial — orders routes, block route, `use-community`, `use-auth` |

### ✅ Phase 3 security polish (complete `feat/phase3-security-polish`)

| # | Issue | Status |
|---|-------|--------|
| D-H5 | **Google OAuth wired** | ✅ `Google` provider in `src/lib/auth.ts`; guards + audit; login/signup UI |
| D-H6 | **CSP `style-src 'unsafe-inline'`** | ✅ Documented in `SECURITY.md`; `frame-src` for Google; `csp.test.ts` |

### ⚠️ High — remaining pre-launch

| # | Issue | Notes |
|---|-------|-------|
| D-H1b | Coverage → **60%+** | Next increment after more admin/shop route tests |
| D-H4b | **`any` cleanup (rest)** | Admin routes, remaining hooks — ~90 occurrences left |

### 💡 Medium — next sprint / post-launch

| # | Issue | Notes |
|---|-------|-------|
| D-M1 | `ExpertService.fee` stored as `String` | Consider `Decimal` migration |
| D-M2 | Message index `(conversationId, createdAt)` | Add compound index for pagination at scale |
| D-M3 | API key rotation UX | Admin revoke + rotate flow; document in API.md |
| D-M4 | Advanced search | Postgres full-text or external search — not started |
| D-M5 | Notification preference granularity | Settings UI backlog |
| D-M6 | Visual regression testing | Not configured |
| D-M7 | `PostCard.tsx` size / refactor | Maintainability |
| D-M8 | N+1 / `resolveNeighborIds` perf | Profile with k6 + query optimization |

### ⏸️ Ops-only (not code — see sections A–C above)

- New Vercel account deploy + DNS
- Staging environment live
- k6 run **on staging URL** (script exists)
- Manual pentest sign-off
- Neon DR drill + uptime monitor
- Inngest + CRON secrets on new host

### Audit score vs today (approximate)

| Audit category | Report (Jun) | Today | Comment |
|----------------|-------------|-------|---------|
| Testing | 5.5/10 | **~6.5/10** | More tests + CI workflows; coverage gate still low |
| DevOps | 7.0/10 | **~8.0/10** | ZAP, Lighthouse, staging/promote, migrate split |
| Security | 8.0/10 | **~8.4/10** | OAuth wired; CSP documented; block + password done |
| Performance | 6.5/10 | **~6.5/10** | k6 script added; asset + query issues remain |
| **Overall** | 7.6/10 | **~8.4/10** | Phase 1–3 code hardening done; **GO blocked by deploy (Section A)** |

---

## Recommended execution order (new Vercel → GO-LIVE)

| Step | When | Task block | Done |
|------|------|------------|------|
| **0** | Pre-deploy (optional) | ~~D-C1–C3 code fixes~~ ✅ Phase 1 complete — proceed to deploy | [x] |
| **1** | Day 1 | [A — New Vercel account cutover](#a--new-vercel-account-cutover-primary-blocker) | [ ] |
| **2** | Day 1 | [A.8 Post-deploy smoke on live URL](#a8--first-deploy-verification) | [ ] |
| **3** | Day 2 | [B — Staging environment on new account](#b--staging-environment-new-vercel-account) | [ ] |
| **4** | Day 2–3 | [C.6 — GitHub secrets refresh](#c6--github-secrets-refresh) | [ ] |
| **5** | Day 3 | [Phase 6 ops — CRON_SECRET + webhook cron](#phase-6--api-platform-stagingproduction-ops) | [ ] |
| **6** | Day 3 | [Phase 7 ops — Inngest keys + async flags](#phase-7--async--inngest-stagingproduction-ops) | [ ] |
| **7** | Week 1 | [Phase 4 — DR drills + uptime monitor](#phase-4--dr--reliability-requires-neon-console--hosting-panel) | [ ] |
| **8** | Week 1 | [Phase 9 ops — k6, ZAP manual review, Lighthouse on PR](#phase-9--validation-ops-post-deploy) | [ ] |
| **9** | Week 2 | [Sign-off checklist](#sign-off-checklist-final-week) + `LAUNCH_READINESS_REPORT.md` GO | [ ] |

---

## A — New Vercel account cutover (PRIMARY BLOCKER)

> **Context:** পুরনো Vercel account/project disconnect করবেন। Neon, Upstash, UploadThing, Sentry **reuse** করা যায় — শুধু Vercel + DNS + GitHub secrets refresh।

### A.1 — New Vercel team / account

- [ ] Create new Vercel account (or team) — **do not** reuse blocked/old account
- [ ] Connect GitHub: `abumdselim/thechattala`
- [ ] Note new **Team ID** (`VERCEL_ORG_ID`) from Vercel → Settings → General

### A.2 — Production project (import repo)

| Setting | Value |
|---------|-------|
| Project name | `thechattala` (or your choice) |
| Production branch | `main` |
| Framework | Next.js (auto) |
| Build Command | `npm run build:vercel` (from repo `vercel.json` — **do not override**) |
| Install Command | `npm ci` |
| Root directory | `./` |

- [ ] Import project from GitHub
- [ ] Copy **Project ID** → GitHub secret `VERCEL_PROJECT_ID`

### A.3 — Environment variables (production)

Copy from old Vercel project or local `.env.production.local`. Full list: `docs/DEPLOYMENT_ENV.md` + `.env.example`.

**Minimum required before first deploy:**

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon **pooled** connection |
| `DIRECT_URL` | Neon **direct** (migrations in `build:vercel`) |
| `AUTH_SECRET` | ≥ 32 chars; rotate if old account was compromised |
| `NEXTAUTH_SECRET` | Same as `AUTH_SECRET` or separate |
| `NEXTAUTH_URL` | `https://www.thechattala.com` (after DNS) or Vercel preview URL for first test |
| `NEXT_PUBLIC_APP_URL` | Public site URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit + cache |
| `UPLOADTHING_SECRET` / `UPLOADTHING_APP_ID` | File uploads |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `SMTP_*` | Production email |

**Add before crons/async (step 5–6):**

| Variable | Notes |
|----------|-------|
| `CRON_SECRET` | `openssl rand -base64 32` |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | From Inngest dashboard |
| `FEATURE_ASYNC_*` | Start `false`; enable after Inngest verified |

- [ ] All production env vars set in new Vercel project
- [ ] **Do not** commit secrets to git

### A.4 — Google OAuth (if domain unchanged)

If `www.thechattala.com` stays the same, OAuth origins/redirects **unchanged**. Verify in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
Authorized JavaScript origins: https://www.thechattala.com
Authorized redirect URIs:       https://www.thechattala.com/api/auth/callback/google
```

- [ ] OAuth client verified for production domain

### A.5 — DNS cutover

Point domain to **new** Vercel project (not old account):

1. Vercel → Project → Settings → Domains → Add `www.thechattala.com` (+ apex if needed)
2. Update DNS at registrar (A/CNAME per Vercel instructions)
3. Wait for SSL provisioning

- [ ] DNS points to new Vercel project
- [ ] HTTPS valid on `https://www.thechattala.com`

### A.6 — Decommission old Vercel account

- [ ] Remove domain from **old** Vercel project (avoid dual routing)
- [ ] Archive or delete old project
- [ ] Revoke old `VERCEL_TOKEN` if exposed in CI/logs

### A.7 — First deploy

```bash
# Option A: push to main → Vercel auto-deploy (recommended)
git push origin main

# Option B: manual CLI (after vercel login on new account)
vercel login
vercel link          # select new team + project
vercel env pull .env.production.local --environment=production
vercel deploy --prod
```

- [ ] First production deploy green on new account
- [ ] Build log shows `migrate:deploy` OK (or "No pending migrations")

### A.8 — First deploy verification

```bash
# Replace with live URL (Vercel URL or custom domain)
STAGING_URL=https://www.thechattala.com npm run smoke:staging
```

Expected: **7/7 passed** (health, OpenAPI, shops, services, directory, emergency, status).

- [ ] Smoke tests pass on new deployment
- [ ] Sign-in (credentials + Google) works
- [ ] Sentry receives a test error (optional)
- [ ] Upload test (avatar) works

---

## B — Staging environment (new Vercel account)

> Optional for first day but **required** before promote workflow + k6 + full QA.  
> Guide: `docs/STAGING_ENVIRONMENT.md`

- [ ] Create git branch `staging` (if not exists): `git checkout -b staging && git push -u origin staging`
- [ ] Neon: create **staging branch** (schema fork, no PII) — separate `DATABASE_URL` / `DIRECT_URL`
- [ ] New Vercel project `thechattala-staging`, production branch = `staging`
- [ ] Staging env vars (separate Upstash Redis, Inngest env = staging)
- [ ] Run: `npm run seed:staging` against staging DB
- [ ] DNS: e.g. `staging.thechattala.com` → staging Vercel project
- [ ] GitHub secret `STAGING_URL` = live staging URL
- [ ] GitHub secret `VERCEL_STAGING_PROJECT_ID`
- [ ] Verify `.github/workflows/staging-deploy.yml` runs on push to `staging`

---

## C.6 — GitHub secrets refresh

Update in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | New account → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Team Settings → General |
| `VERCEL_PROJECT_ID` | New production project |
| `VERCEL_STAGING_PROJECT_ID` | New staging project (when ready) |
| `STAGING_URL` | Live staging base URL |
| `STAGING_DATABASE_URL` | Optional — enables weekly backup verify |

- [ ] All Vercel-related secrets updated (remove old account values)
- [ ] GitHub **Environment** `production` has required reviewers — `docs/PROMOTION_WORKFLOW.md`

---

## Phase 6 — API Platform (staging/production ops)

| # | Task | Where | Notes |
|---|------|-------|-------|
| 6-A | Set `CRON_SECRET` | New Vercel → Environment Variables (staging + prod) | `openssl rand -base64 32` |
| 6-B | Schedule webhook retry cron | Vercel Cron (`vercel.json`) or external scheduler | `GET /api/cron/webhook-retry` every 5 min with `Authorization: Bearer $CRON_SECRET` |
| 6-C | Verify webhook test endpoint | Staging | `POST /api/webhooks/test` after subscription with `ping` event |
| 6-D | Verify idempotency in staging | Staging | Duplicate `POST /api/orders` with same `Idempotency-Key` → `Idempotent-Replayed: true` |
| 6-E | OpenAPI live check | Staging/prod | `GET /api/openapi.json`, browse `/api/docs` |

### Example cron test (after deploy)

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR-STAGING-URL/api/cron/webhook-retry
# Expected: {"success":true,"processed":0} (or N pending)
```

### `vercel.json` cron snippet (add when crons enabled)

```json
{
  "crons": [
    { "path": "/api/cron/webhook-retry", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/data-retention", "schedule": "0 3 * * *" }
  ]
}
```

- [ ] Crons committed + deployed on new Vercel (Pro plan may be required for cron)

---

## Phase 7 — Async / Inngest (staging/production ops)

- [ ] Set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` in new Vercel (staging + prod)
- [ ] Sync Inngest app with `https://YOUR-URL/api/inngest`
- [ ] Enable `FEATURE_ASYNC_MAIL=true` in production after Inngest verified
- [ ] Run k6 against staging URL: `npm run loadtest:k6 -- -e BASE_URL=https://...`
- [ ] Record k6 p95/error rate in `LAUNCH_READINESS_REPORT.md`
- [ ] Confirm Inngest dashboard shows mail/export/retention job success rate > 99%

---

## Phase 4 — DR / Reliability (requires Neon Console + hosting panel)

| # | Task | Guide |
|---|------|-------|
| 4-A | Neon PITR restore drill → staging branch | `docs/runbooks/DR_DRILL_GUIDE_BN.md` |
| 4-B | Hosting rollback drill on **new** Vercel (Promote previous deployment) | `docs/runbooks/DR_DRILL_GUIDE_BN.md` |
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

- [ ] Create `staging` git branch + Vercel staging project on **new account** — `docs/STAGING_ENVIRONMENT.md`
- [ ] GitHub secrets refreshed (see [C.6](#c6--github-secrets-refresh))
- [ ] GitHub `production` environment with required reviewers
- [ ] Fill secondary on-call name in `docs/ON_CALL_ROTATION.md`
- [ ] Two-person runbook training sign-off in `LAUNCH_READINESS_REPORT.md`
- [ ] Optional: `terraform apply` when Neon/Upstash API keys ready — `infra/terraform/`

---

## Phase 9 — Validation ops (post-deploy)

| # | Task | Notes |
|---|------|-------|
| 9-A | OWASP ZAP baseline on live URL | `.github/workflows/security-zap.yml` or manual; fill `docs/security/PENTEST_REPORT.md` |
| 9-B | Manual pentest review — zero Critical/High open | Template in `docs/security/PENTEST_REPORT.md` |
| 9-C | Lighthouse CI ≥ 90 on `/`, `/dashboard`, `/shops` | `.github/workflows/lighthouse.yml` — run on PR |
| 9-D | Playwright E2E against staging before prod promote | `PLAYWRIGHT_BASE_URL=https://staging... npm run test:e2e` |
| 9-E | SOC2 Type I readiness walkthrough | `docs/compliance/SOC2_TYPE1_READINESS.md` |

---

## Already completed (no longer deferred)

| Area | Status |
|------|--------|
| Phases 0–9 code | ✅ Merged to `main` |
| CI: lint, typecheck, 218 tests, build:ci | ✅ |
| Migration order fix (fresh Postgres) | ✅ `2026061010*` renames |
| Migrate/build split (`build` vs `build:vercel`) | ✅ |
| Staging smoke script | ✅ `npm run smoke:staging` |
| OpenAPI, idempotency, webhooks, API keys | ✅ |
| Inngest jobs (code), feature flags, k6 script | ✅ |
| ADRs, on-call doc, incident template, promote workflow (CI) | ✅ |
| E2E expansion + axe a11y + contract/chaos tests | ✅ |

---

## Sign-off checklist (final week)

- [ ] **Section A** complete — new Vercel prod live + smoke 7/7
- [ ] **Section B** complete — staging URL reachable
- [ ] Phase 6 + 7 ops (crons, Inngest) verified
- [ ] Phase 4 DR drill + uptime monitor
- [ ] Phase 9 manual pentest + k6 recorded
- [ ] `LAUNCH_READINESS_REPORT.md` updated → **GO**
- [ ] `docs/ENTERPRISE_SCORECARD.md` sign-off row filled
- [ ] On-call backup contact filled in runbooks

---

## Related docs

| Doc | Use when |
|-----|----------|
| `docs/DEPLOYMENT.md` | First-time / redeploy steps |
| `docs/DEPLOYMENT_ENV.md` | Full env var list |
| `docs/STAGING_ENVIRONMENT.md` | Staging project setup |
| `docs/PROMOTION_WORKFLOW.md` | staging → prod promotion |
| `docs/ENTERPRISE_SCORECARD.md` | Internal GO/NO-GO criteria |
| `LAUNCH_READINESS_REPORT.md` | Executive launch decision |

**Last updated:** 2026-03-13 — audit cross-check (Jun 2026 report) + new Vercel cutover plan.
