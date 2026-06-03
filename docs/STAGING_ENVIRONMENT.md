# Staging Environment Setup

> **Phase 8.1** — Separate Neon branch + hosting project; auto-deploy on `staging` branch.

---

## Overview

| Component | Production | Staging |
|-----------|------------|---------|
| Git branch | `main` | `staging` |
| Vercel project | `thechattala` (prod) | `thechattala-staging` |
| Neon | Production branch | Staging branch (fork from prod schema, no PII) |
| Upstash Redis | Prod database | Staging database (separate) |
| URL | `https://www.thechattala.com` | `https://staging.thechattala.com` (example) |
| CI workflow | `.github/workflows/ci.yml` | `.github/workflows/staging-deploy.yml` |

---

## Step 1 — Create `staging` branch

```bash
git checkout main && git pull
git checkout -b staging
git push -u origin staging
```

Enable branch protection on `staging` (require PR + CI, no direct pushes optional).

---

## Step 2 — Neon staging branch

1. Open [Neon Console](https://console.neon.tech) → your project.
2. **Branches** → **Create branch** from `main` (schema only).
3. Name: `staging`.
4. Copy **pooled** and **direct** connection strings.

Set in Vercel staging project:

```
DATABASE_URL=postgresql://...@...-staging.../neondb?sslmode=require
DIRECT_URL=postgresql://...@...-staging.../neondb?sslmode=require
```

Run migrations + seed:

```bash
DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
npm run seed:staging
```

Staging credentials: see `scripts/seed-staging.ts` (`staging-admin@thechattala.test` / `StagingSecure123!`).

---

## Step 3 — Vercel staging project

1. **Add New Project** → same GitHub repo.
2. Project name: `thechattala-staging`.
3. **Production Branch:** `staging` (not `main`).
4. Copy all env vars from production with staging values:
   - `NEXT_PUBLIC_APP_URL` → staging URL
   - `NEXTAUTH_URL` → staging URL
   - Separate Upstash Redis credentials
   - `FEATURE_ASYNC_*` enabled for testing Inngest
   - `INNGEST_*` keys (Inngest env = staging)

---

## Step 4 — GitHub secrets (repository)

| Secret | Purpose |
|--------|---------|
| `STAGING_URL` | Live URL for smoke tests |
| `STAGING_DATABASE_URL` | Weekly backup verify (optional) |
| `VERCEL_TOKEN` | CLI deploy from Actions |
| `VERCEL_ORG_ID` | Vercel team ID |
| `VERCEL_STAGING_PROJECT_ID` | Staging project ID |
| `VERCEL_PROJECT_ID` | Production project ID |

---

## Step 5 — GitHub environments

**Settings → Environments:**

| Environment | Protection |
|-------------|------------|
| `staging` | Optional reviewers |
| `production` | **Required reviewers** (≥ 1) — blocks promote workflow |

---

## Auto-deploy flow

```
push to staging
  → staging-deploy.yml
    → validate + build
    → smoke (if STAGING_URL set)
    → vercel deploy (if VERCEL_* secrets set)
```

---

## Weekly sync (recommended)

Merge `main` → `staging` weekly to keep staging current:

```bash
git checkout staging && git pull
git merge origin/main
git push origin staging
```

Or promote feature branches to `staging` first, then `main` after QA.

---

## Related docs

- [Phase B ops runbook](./launch/PHASE_B_OPS.md) — **current**
- [Promotion Workflow](./PROMOTION_WORKFLOW.md)
- [Branch Strategy](./BRANCH_STRATEGY.md)
- [Deferred post-completion tasks](./DEFERRED_POST_COMPLETION_TASKS.md)
