# Production Deployment Guide

> **Platform:** Vercel (recommended) + Neon DB + UploadThing
> **Target:** Zero-downtime deployment with automated CI/CD

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [First-Time Vercel Setup](#first-time-vercel-setup)
- [Deployment Steps](#deployment-steps)
- [Environment Variables (Production)](#environment-variables-production)
- [Database Migrations in Production](#database-migrations-in-production)
- [Post-Deployment Smoke Tests](#post-deployment-smoke-tests)
- [Rollback Procedure](#rollback-procedure)
- [Monitoring & Alerting](#monitoring--alerting)
- [On-Call Escalation](#on-call-escalation)

---

## Pre-Deployment Checklist

Run through this checklist **before every production deployment**:

### Code Quality

- [ ] `npm run build` succeeds locally with zero errors
- [ ] `npm run typecheck` passes (zero TypeScript errors)
- [ ] `npm run lint` passes (zero ESLint errors)
- [ ] `npm run test` passes (all unit + integration tests green)
- [ ] No `console.log` statements with sensitive data in committed code

### Environment

- [ ] All required environment variables are set in Vercel's project settings
- [ ] `DATABASE_URL` uses the **Pooled** Neon connection string
- [ ] `DIRECT_URL` uses the **Direct** Neon connection string (for migrations)
- [ ] `AUTH_SECRET` is at least 32 characters and randomly generated
- [ ] `NEXTAUTH_URL` is set to the production domain (`https://www.thechattala.com`)
- [ ] Google OAuth redirect URIs include the production callback URL
- [ ] Sentry DSN is configured and errors are flowing to the dashboard

### Infrastructure

- [ ] Database schema migrations have been tested on a staging branch (Neon branching)
- [ ] SSL certificate is valid (auto-managed by Vercel)
- [ ] DNS records are pointing to Vercel
- [ ] UploadThing app is configured for the production domain
- [ ] Rate limiting (Upstash Redis) is connected and tested

### Security

- [ ] No secrets in source code or `.env.example`
- [ ] Security headers are configured in `next.config.ts`
- [ ] CORS is restricted to production domain
- [ ] Admin routes are guarded by `isAdmin` check

---

## First-Time Vercel Setup

Follow these steps **only once** for the initial deployment.

### Step 1: Connect Your GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select `abumdselim/thechattala` from the list
4. Click **Import**

### Step 2: Configure the Project

On the configuration screen:

| Setting | Value |
|---------|-------|
| Framework Preset | **Next.js** (auto-detected) |
| Root Directory | `./` (default) |
| Build Command | `npm run build` |
| Output Directory | `.next` (default) |
| Install Command | `npm install` |

### Step 3: Add Environment Variables

Click **Environment Variables** and add all variables from `.env.example` with production values.

> **Critical:** Add variables to **all three environments** (Production, Preview, Development) or selectively as needed.

| Variable | Env |
|----------|-----|
| `DATABASE_URL` | Production, Preview |
| `DIRECT_URL` | Production, Preview |
| `AUTH_SECRET` | Production, Preview |
| `NEXTAUTH_URL` | Production only (`https://www.thechattala.com`) |
| `GOOGLE_CLIENT_ID` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | Production, Preview |
| `UPLOADTHING_SECRET` | Production, Preview |
| `UPLOADTHING_APP_ID` | Production, Preview |
| `UPSTASH_REDIS_REST_URL` | Production, Preview |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview |
| `SMTP_HOST` | Production |
| `SMTP_PORT` | Production |
| `SMTP_USER` | Production |
| `SMTP_PASSWORD` | Production |
| `SMTP_FROM` | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | Production, Preview |
| `NODE_ENV` | Production → `production` |

### Step 4: Deploy

Click **Deploy**. Vercel will:
1. Clone the repository
2. Run `npm install` (triggers `prisma generate` via postinstall)
3. Run `npm run build`
4. Deploy to Vercel's global Edge Network

First build takes ~3–5 minutes. Subsequent deploys take ~1–2 minutes.

---

## Deployment Steps

For every subsequent deployment after initial setup:

### Automated (Recommended)

```
1. Merge your PR into `main` on GitHub
   └── Vercel webhook triggers automatically
         └── Vercel pulls latest code
               └── Runs: npm install → npm run build
                     └── Deploys to production if build passes
```

### Manual (for hotfixes)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### Full Deployment Sequence

```
Step 1: Push to main (or merge PR)
         ↓
Step 2: Vercel builds automatically (~2 min)
         ↓
Step 3: Check build logs at vercel.com/dashboard
         ↓
Step 4: Run database migrations (if schema changed)
         ↓
Step 5: Run smoke tests
         ↓
Step 6: Monitor Sentry for 24h
```

---

## Environment Variables (Production)

### Creating Production Environment on Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select the `thechattala` project
3. Navigate to **Settings → Environment Variables**
4. Add each variable with **Environment: Production**

### Production-Specific Values

```env
# Use POOLED URL for the app
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Use DIRECT URL for migrations only
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Production domain — no trailing slash
NEXTAUTH_URL="https://www.thechattala.com"

# Strong, unique secret — generate with: openssl rand -base64 32
AUTH_SECRET="<64-character-random-string>"
NEXTAUTH_SECRET="<another-64-character-random-string>"

# Production Sentry project DSN
NEXT_PUBLIC_SENTRY_DSN="https://your-key@sentry.io/your-project"

# Production email service
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="production-smtp-user"
SMTP_PASSWORD="production-smtp-api-key"
SMTP_FROM="hello@thechattala.com"
```

### Google OAuth Production Setup

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

Add to **Authorized JavaScript Origins:**
```
https://www.thechattala.com
```

Add to **Authorized Redirect URIs:**
```
https://www.thechattala.com/api/auth/callback/google
```

---

## Database Migrations in Production

> **Never run `prisma db push` in production** — it can cause data loss. Always use `migrate deploy`.

### When to Run Migrations

Run after deployment **only if** `prisma/migrations/` has new migration files.

### How to Run

```bash
# Option 1: Vercel CLI (recommended)
vercel env pull .env.production.local  # Pull production env vars
npx prisma migrate deploy              # Apply pending migrations

# Option 2: Via a one-off Vercel function or admin script
# Set DIRECT_URL in environment before running
DATABASE_URL=$DIRECT_URL npx prisma migrate deploy
```

### Neon DB Branch Strategy (Staging)

Neon's branching feature lets you test migrations safely:

```
1. Create a branch in Neon Console: "staging"
   └── Branch inherits current production data

2. Update DIRECT_URL to point to the staging branch

3. Run: npx prisma migrate dev
   └── Test that migration works

4. If OK, run against production:
   npx prisma migrate deploy
```

---

## Post-Deployment Smoke Tests

Run these manual checks after every production deployment:

```
[ ] Home page loads: https://www.thechattala.com
[ ] Sign in with credentials works
[ ] Sign in with Google OAuth works
[ ] Dashboard loads after sign in
[ ] Community feed loads posts
[ ] Creating a post works
[ ] Profile page loads with user data
[ ] File upload (avatar) works
[ ] Password reset email is sent
[ ] Admin dashboard accessible (for admin users)
[ ] Sentry receives a test error (optional)
```

### Automated E2E (if configured)

```bash
# Run against production (requires PLAYWRIGHT_BASE_URL)
PLAYWRIGHT_BASE_URL=https://www.thechattala.com npx playwright test
```

---

## Rollback Procedure

### Instant Rollback via Vercel (< 30 seconds)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → `thechattala`
2. Click **Deployments** tab
3. Find the last known-good deployment
4. Click **⋯** → **Promote to Production**

Vercel instantly reroutes traffic to the previous deployment — no downtime.

### Git Rollback (if Vercel rollback isn't enough)

```bash
# Find the last good commit
git log --oneline -10

# Create a revert commit
git revert <bad-commit-hash>

# Push to trigger a new deployment
git push origin main
```

### Database Rollback

> ⚠️ Database rollbacks are risky — avoid if at all possible.

If a migration introduced a bug and must be undone:

```bash
# 1. Identify the migration to roll back
npx prisma migrate status

# 2. Create a new migration that reverses the change
npx prisma migrate dev --name rollback_xxx

# 3. Apply to production
npx prisma migrate deploy
```

For data loss scenarios, restore from a Neon DB backup:

1. Go to Neon Console → **Branches** → **Restore**
2. Select a point-in-time before the bad deployment
3. Update `DATABASE_URL` to point to the restored branch
4. Validate data integrity before making it primary

### Notifying Users

For outages longer than 5 minutes:

1. Post a status update on [status.thechattala.com](https://status.thechattala.com) (or Twitter/X)
2. Update the app's error page or show a maintenance banner
3. Send an email to affected users if data integrity is at risk

---

## Monitoring & Alerting

### Sentry (Error Tracking)

**Setup:**

1. Create a project at [sentry.io](https://sentry.io) → Next.js
2. Add `NEXT_PUBLIC_SENTRY_DSN` to Vercel environment variables
3. Sentry is already integrated via `sentry.client.config.ts` and `sentry.server.config.ts`

**Alert Rules to Configure in Sentry:**

| Alert | Threshold | Notify |
|-------|-----------|--------|
| Error spike | >10 new errors in 5 min | Email + Slack |
| New issue | First occurrence | Email |
| P1 error | Any error with "auth" or "database" in stack | Immediate |

### Vercel Analytics

Enable in Vercel dashboard → **Analytics** tab:

- Core Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Function execution times

### Uptime Monitoring

Use [BetterUptime](https://betteruptime.com) or [UptimeRobot](https://uptimerobot.com) (free):

- Monitor: `https://www.thechattala.com`
- Monitor: `https://www.thechattala.com/api/auth/session`
- Alert threshold: down for > 2 minutes

---

## On-Call Escalation

### Severity Levels

| Level | Description | Response Time | Action |
|-------|-------------|---------------|--------|
| **P1 — Critical** | Site down, auth broken, data loss | Immediate | Page on-call, start incident channel |
| **P2 — High** | Major feature broken, >50% users affected | < 1 hour | Notify team, begin fix |
| **P3 — Medium** | Feature degraded, workaround exists | < 4 hours | Create issue, fix in next sprint |
| **P4 — Low** | Minor UI bug, affects <5% users | < 48 hours | Log issue, fix when available |

### Escalation Path

```
1. Sentry / UptimeRobot alert fires
        ↓
2. On-call developer (Abu Md. Selim) acknowledges within 15 min
        ↓
3. If not acknowledged → page secondary contact
        ↓
4. P1 incidents: start a Discord/Slack incident channel
        ↓
5. Post user-facing status update if > 5 min downtime
        ↓
6. Write post-mortem within 24h of P1/P2 resolution
```

### Useful Links During Incidents

| Resource | URL |
|----------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Neon DB Console | https://console.neon.tech |
| Sentry Issues | https://sentry.io/organizations/your-org/issues/ |
| Upstash Console | https://console.upstash.com |
| GitHub Repo | https://github.com/abumdselim/thechattala |

---

*The Chattala — Built for Chittagong. Engineered for the future.*

*© 2026 [Inievo Technologies](https://inievo.com). All rights reserved.*
