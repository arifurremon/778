# Phase B — Deploy & Ops Validation

> **Prerequisite:** Phase A complete (`joinDate`, env hardening, doc archive)  
> **Production URL:** `https://www.thechattala.com`  
> **Goal:** Validated production + staging + crons + Inngest + rotated secrets

---

## Progress tracker

| Step | Task | Owner | Script / Doc | Done |
|------|------|-------|--------------|------|
| **B.1** | GitHub secrets refresh | You | `npm run checklist:github-secrets` | [ ] |
| **B.2** | Staging environment | You | `docs/STAGING_ENVIRONMENT.md` + below | [ ] |
| **B.3** | `CRON_SECRET` + Vercel crons | You + Agent | `vercel.json` crons ✅ in repo | [ ] |
| **B.4** | Inngest keys + async flags | You | Inngest dashboard | [ ] |
| **B.5** | Secret rotation | You | [`STEP_B5_SECRET_ROTATION.md`](./STEP_B5_SECRET_ROTATION.md) | [ ] |

---

## B.1 — GitHub secrets refresh

```bash
npm run checklist:github-secrets
```

Set all listed secrets in GitHub → Settings → Secrets → Actions.

| Secret | Where to get |
|--------|--------------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens |
| `VERCEL_ORG_ID` | Vercel → Team → Settings → General |
| `VERCEL_PROJECT_ID` | Production project → Settings |
| `VERCEL_STAGING_PROJECT_ID` | After B.2 — staging project |
| `STAGING_URL` | After first staging deploy |

**Environments:** Create `staging` + `production` (production requires ≥1 reviewer).

**Done when:** `staging-deploy.yml` can deploy without missing-secret skips.

---

## B.2 — Staging environment

### 2a — Git branch

```bash
bash scripts/setup-staging-branch.sh
git push -u origin staging
```

### 2b — Neon staging branch

1. Neon Console → **Branches** → Create `staging` from `main` (schema only)
2. Copy pooled + direct URLs

### 2c — Vercel staging project

1. **Add project** → same repo, name `thechattala-staging`
2. **Production branch:** `staging` (not `main`)
3. Copy env vars from production with **staging values**:
   - `DATABASE_URL` / `DIRECT_URL` → Neon staging branch
   - `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` → staging URL
   - **Separate** Upstash Redis database
   - `FEATURE_ASYNC_*` → `true` on staging for Inngest testing

```bash
vercel env pull .env.staging.local --environment=preview
npm run verify:staging-env
npm run seed:staging   # uses DATABASE_URL from env
```

### 2d — First deploy + smoke

After Vercel staging URL is live:

```bash
STAGING_URL=https://your-staging-url.vercel.app npm run smoke:staging
```

Set GitHub secret `STAGING_URL` to this URL.

**Done when:** staging smoke green + seed admin login works.

Full guide: [`docs/STAGING_ENVIRONMENT.md`](../STAGING_ENVIRONMENT.md)

---

## B.3 — CRON_SECRET + Vercel crons

### 3a — Generate secret

```bash
openssl rand -base64 32
```

Add `CRON_SECRET` to Vercel → **Production** and **Staging** env vars.

### 3b — Deploy crons

Crons are defined in repo root `vercel.json`:

| Path | Schedule |
|------|----------|
| `/api/cron/webhook-retry` | Every 5 min |
| `/api/cron/data-retention` | Daily 03:00 UTC |

> **Note:** Vercel Cron requires **Pro plan**. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.

Redeploy production after merge.

### 3c — Verify live

```bash
vercel env pull .env.production.local --environment=production
npm run verify:phase-b-env
DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live
```

Expected: both cron endpoints return `{"success":true,...}`.

---

## B.4 — Inngest + async flags

### 4a — Inngest dashboard

1. [inngest.com](https://www.inngest.com) → create app **The Chattala**
2. Copy `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`
3. Add to Vercel staging + production
4. **Sync app** → URL: `https://YOUR-URL/api/inngest`

### 4b — Verify sync

```bash
curl -s "https://YOUR-STAGING-URL/api/inngest" | head -c 200
# Should not 404/500
```

Inngest dashboard → Functions → should list mail/export/retention handlers.

### 4c — Enable async (staging first)

| Variable | Staging | Production (after verify) |
|----------|---------|---------------------------|
| `FEATURE_ASYNC_MAIL` | `true` | `true` |
| `FEATURE_ASYNC_JOBS` | `true` | `true` |
| `FEATURE_ASYNC_RETENTION` | `true` | `true` |

Test: register on staging → verification email queued in Inngest → delivered.

```bash
npm run verify:phase-b-env -- .env.staging.local
```

---

## B.5 — Secret rotation

If production secrets were exposed (chat, old Vercel account):

→ [`STEP_B5_SECRET_ROTATION.md`](./STEP_B5_SECRET_ROTATION.md)

**Minimum rotate:** `AUTH_SECRET`, `CRON_SECRET`, `SMTP_PASSWORD`, `UPSTASH_REDIS_REST_TOKEN`, `PUSHER_SECRET`, `UPLOADTHING_SECRET`, Google OAuth client secret.

---

## Phase B complete when

- [ ] B.1 GitHub secrets set; staging deploy workflow green
- [ ] B.2 Staging URL live; `npm run smoke:staging` pass
- [ ] B.3 `npm run verify:cron-live` pass on production
- [ ] B.4 Inngest synced; test mail job on staging
- [ ] B.5 Critical secrets rotated (if previously exposed)
- [ ] Mark Phase B done in [`AUDIT_EXECUTION_PLAN.md`](../AUDIT_EXECUTION_PLAN.md)

**Next:** Phase D — coverage 60%, DashboardLayout split

---

## Quick command reference

```bash
npm run checklist:github-secrets
npm run verify:staging-env
npm run verify:phase-b-env
DEPLOY_URL=https://www.thechattala.com npm run smoke:production
STAGING_URL=https://... npm run smoke:staging
DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live
bash scripts/setup-staging-branch.sh
```
