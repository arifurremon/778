# Pre-Launch Runbook

> **Purpose:** Step-by-step execution guide for the 24 hours leading up to, and immediately following, the production launch of The Chattala v1.0.0.
>
> **Execute this runbook in order.** Each step must be completed and checked off by the assigned person before proceeding.
>
> **Primary Executor:** Abu Md. Selim (Engineering Lead)
> **Backup:** *(designate backup)*
> **Launch Window:** *(fill in: e.g., 2026-05-15 at 10:00 AM BST)*

---

## Pre-Requisites (Before Starting This Runbook)

- [ ] `PRODUCTION_CHECKLIST.md` fully reviewed — all Critical items ✅
- [ ] `LAUNCH_READINESS_REPORT.md` signed off by Engineering + Security + Product leads
- [ ] Staging environment verified to mirror production
- [ ] Team notified of launch window (Slack/Discord announcement made)
- [ ] Personal availability confirmed for T-24 through T+24

---

## T-24 Hours: Final Validation

**Executor:** Engineering Lead
**Time:** ___:___ (local) / ___:___ UTC

### Code & Build

- [ ] Pull latest `main` branch locally: `git pull origin main`
- [ ] Run full build: `npm run build`
  - Expected: Zero errors. Build completes in < 3 min.
  - If fails: **STOP** — raise P1, do not proceed
- [ ] Run type check: `npm run typecheck`
  - Expected: 0 TypeScript errors
- [ ] Run linter: `npm run lint`
  - Expected: 0 errors

### Tests

- [ ] Run all tests: `npm run test`
  - Expected: All tests pass, coverage report generated
  - Coverage on API routes: record actual percentage `____%`
  - If < 60%: **NO-GO** on testing — log as blocker in `LAUNCH_READINESS_REPORT.md`
- [ ] Run integration tests: `npm run test:integration`
  - Expected: Auth + Post integration tests green
- [ ] Run E2E tests against staging: `npm run test:e2e`
  - Expected: All Playwright tests pass

### Staging Verification

- [ ] Visit staging URL and confirm:
  - [ ] Home page loads (no blank screen / crash)
  - [ ] Registration flow works end-to-end
  - [ ] Login with credentials works
  - [ ] Login with Google OAuth works
  - [ ] Community feed loads posts
  - [ ] Creating a post works
  - [ ] Profile page loads with avatar
  - [ ] Admin panel accessible (test with admin user)
  - [ ] Password reset email arrives within 2 minutes

### Security Audit (Final)

- [ ] Verify no `.env.local` or `.env.production` committed to Git:
  ```bash
  git log --all -- '*.env*'   # Should show no secret files
  git status                   # Nothing sensitive unstaged
  ```
- [ ] Confirm `AUTH_SECRET` in Vercel production settings is ≥ 32 chars and not the default
- [ ] Confirm `NEXTAUTH_URL` = `https://www.thechattala.com` (not localhost)
- [ ] Confirm Google OAuth redirect URIs include only production domain
- [ ] Run a quick OWASP header check via [securityheaders.com](https://securityheaders.com) on staging URL
  - Expected: Rating **A** or **A+**

### Performance Check

- [ ] Run Lighthouse on staging (Chrome DevTools or CLI):
  ```bash
  npx lighthouse https://staging.thechattala.com --output=html --output-path=./lighthouse-report.html
  ```
  - LCP: `____` s (target < 3s)
  - Performance score: `____` (target > 70)
  - If LCP > 4s: escalate, do not proceed to launch

**T-24 Checkpoint: ✅ All above complete — proceed to T-4**

---

## T-4 Hours: Infrastructure & Team Prep

**Executor:** Engineering Lead
**Time:** ___:___ (local)

### Database

- [ ] Take manual database backup via Neon Console:
  1. Go to [console.neon.tech](https://console.neon.tech)
  2. Select production project
  3. Navigate to **Branches** → Create a new branch named `backup-pre-launch-YYYYMMDD`
  4. Note the backup branch ID: `________________`
- [ ] Verify backup is restorable (switch connection string to backup branch, run `npx prisma db pull` to confirm schema matches)
- [ ] Run migration status check: `npx prisma migrate status`
  - Expected: "Database schema is up to date"
  - If there are pending migrations: **apply them now** — do not launch with pending migrations

### Monitoring

- [ ] Verify Sentry is receiving events:
  1. Trigger a test error on staging (e.g., visit a non-existent route)
  2. Confirm it appears in Sentry dashboard within 60 seconds
- [ ] Verify UptimeRobot / BetterUptime monitor is active for production URL
- [ ] Confirm Vercel Analytics is enabled on the production project
- [ ] Set Sentry alert rule: Email + notification if error rate > 10 events/5 min

### Team Notification

- [ ] Send launch announcement to team:
  ```
  🚀 Launch in 4 hours!
  Time: [time]
  URL: https://www.thechattala.com
  
  What you need to do:
  - Be available on Discord/WhatsApp for the next 6 hours
  - Know the rollback procedure (see DEPLOYMENT.md)
  - Monitor your Sentry email alerts
  
  Runbook: PRE_LAUNCH_RUNBOOK.md
  Emergency contact: Abu Md. Selim — [phone]
  ```
- [ ] Confirm backup on-call is available: `[ ] Confirmed by: _______`
- [ ] Test incident communication channel is working (Discord/WhatsApp group ping)

### Vercel Environment Final Check

- [ ] Open Vercel Dashboard → `thechattala` → Settings → Environment Variables
- [ ] Confirm all production variables are set (cross-reference with `.env.example`):
  - [ ] `DATABASE_URL` (pooled Neon)
  - [ ] `DIRECT_URL` (direct Neon)
  - [ ] `AUTH_SECRET`
  - [ ] `NEXTAUTH_URL` = `https://www.thechattala.com`
  - [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
  - [ ] `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID`
  - [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  - [ ] `SMTP_HOST` + `SMTP_PORT` + `SMTP_USER` + `SMTP_PASSWORD` + `SMTP_FROM`
  - [ ] `NEXT_PUBLIC_SENTRY_DSN`

**T-4 Checkpoint: ✅ All above complete — proceed to T-1**

---

## T-1 Hour: Final Readiness

**Executor:** Engineering Lead
**Time:** ___:___ (local)

### Sanity Check on Staging

- [ ] Make one final login + post creation on staging — confirms zero regressions in last hour
- [ ] Confirm staging Vercel deployment used the same commit SHA that will go to production
  - Staging commit: `git rev-parse HEAD` = `________________________`

### Rollback Dry Run

- [ ] Confirm rollback procedure is understood by at least 2 people:
  1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
  2. Click `thechattala` → **Deployments**
  3. Identify the current production deployment
  4. Know how to "Promote to Production" the previous one
- [ ] Note the pre-launch deployment URL (for instant rollback reference):
  ```
  Rollback target: https://thechattala-git-[commit]-inievo.vercel.app
  ```

### Team Brief

- [ ] 5-minute voice call / message with team covering:
  - Launch steps (below)
  - Who does what
  - When to declare NO-GO (any P1 in first 30 min)
  - How to trigger rollback

**T-1 Checkpoint: ✅ All above complete — proceed to T-0**

---

## T-0: Launch Execution

**Executor:** Engineering Lead
**Time:** ___:___ (local)

> ⚠️ Once you begin, monitor continuously. Do not start other tasks.

### Step 1 — Deploy to Production

```bash
# Option A: Push to main (triggers auto-deploy via Vercel webhook)
git push origin main

# Option B: Manual deploy via Vercel CLI
vercel --prod
```

- [ ] Note deployment start time: `___:___`
- [ ] Watch Vercel build logs at [vercel.com/dashboard](https://vercel.com/dashboard)
- [ ] Wait for deployment to complete (typically 2–4 minutes)
- [ ] Note deployment end time: `___:___`
- [ ] Note deployment URL: `https://thechattala-git-[hash]-inievo.vercel.app`

### Step 2 — Run Database Migrations (if schema changed)

> Skip if no new migration files were added since last deployment.

```bash
# Pull production env vars first
vercel env pull .env.production.local

# Apply pending migrations
npx prisma migrate deploy
```

- [ ] Migration output shows: "All migrations have been applied"
- [ ] If migration fails: **STOP** — trigger rollback immediately

### Step 3 — Wait 5 Minutes

- [ ] Wait 5 full minutes after deployment completes before smoke testing
  - Allows DNS propagation and Vercel Edge cache warm-up
  - Watch Sentry for any immediate crash errors during this time

### Step 4 — Smoke Tests

Execute each in order on **production** (`https://www.thechattala.com`):

- [ ] **Home page loads** — no blank screen, no JavaScript console errors
- [ ] **Registration** — create a new account with a test email
  - Expected: Redirected to `/dashboard` within 5 seconds
- [ ] **Login with credentials** — sign out, sign back in
  - Expected: Session persists, dashboard loads
- [ ] **Google OAuth** — sign out, click "Continue with Google"
  - Expected: OAuth flow completes, session created
- [ ] **Create a post** — navigate to Community, write a test post
  - Expected: Post appears in feed immediately
- [ ] **Profile page** — upload a test avatar
  - Expected: Image uploaded, old image deleted, UI updates instantly
- [ ] **Admin panel** — sign in as admin, access `/admin`
  - Expected: Admin dashboard loads with user/post/shop data
- [ ] **Password reset** — trigger forgot-password flow
  - Expected: Email arrives within 2 minutes

### Step 5 — Monitor Error Rate

- [ ] Open Sentry dashboard
- [ ] Confirm error rate is at or near **0 new events**
- [ ] Open Vercel Analytics → Functions tab
- [ ] Confirm average response times are **< 500ms** for API routes
- [ ] Open UptimeRobot — confirm site shows **UP**

### Launch Decision

```
All smoke tests pass AND error rate < 0.5%?
  → ✅ LAUNCH CONFIRMED — announce to team and stakeholders

Any smoke test fails OR error rate > 1%?
  → ❌ ABORT — trigger rollback (Step 6 below), investigate
```

**LAUNCH CONFIRMED AT: ___:___ UTC**

### Step 6 — Rollback (if needed)

```
1. Go to vercel.com/dashboard → thechattala → Deployments
2. Find the previous successful deployment
3. Click ⋯ → "Promote to Production"
4. Wait 60 seconds
5. Verify rollback URL loads correctly
6. Post status update: "Temporary rollback in progress — investigation underway"
7. Notify team immediately
```

---

## T+30 Minutes: First Check-In

**Executor:** Engineering Lead
**Time:** ___:___ (local)

- [ ] Review Sentry: how many new errors since launch? `____`
  - If > 20 new errors in 30 min: escalate, investigate
- [ ] Review Vercel Functions: are there any timeouts or 500s in logs?
- [ ] Check Neon console: connection count and query times normal?
- [ ] Check UptimeRobot: 100% uptime since launch?
- [ ] Test one more registration with a fresh email — confirm new user flow works
- [ ] Send T+30 status update to team:
  ```
  T+30 Status:
  ✅ Site up
  Error count: [X] (target: 0)
  Avg response: [X]ms (target: <500ms)
  Uptime: 100%
  Status: [STABLE / MONITORING / CONCERN]
  ```

---

## T+2 Hours: Stakeholder Check-In

**Executor:** Engineering Lead
**Time:** ___:___ (local)

- [ ] Continue monitoring Sentry — review all new issues and triage (P1/P2/P3)
- [ ] Check user registrations count in DB: `SELECT COUNT(*) FROM "User";` via Prisma Studio
- [ ] Send stakeholder update:
  ```
  The Chattala v1.0.0 Launch — 2 Hour Update
  
  Status: [GO / MONITORING / CONCERN]
  
  Metrics so far:
  - New users registered: [X]
  - Posts created: [X]
  - Error rate: [X]% (target < 0.5%)
  - Uptime: [X]% (target 99.9%)
  - Avg API response: [X]ms (target < 500ms)
  
  No critical issues / [Issue summary if any]
  
  Next check-in: T+24h
  ```

---

## T+24 Hours: Full System Review

**Executor:** Engineering Lead
**Time:** Next day ___:___ (local)

### Metrics Review

- [ ] Pull Vercel Analytics report (LCP, error rate, function timings)
- [ ] Pull Sentry error summary — list all new issues, triage by severity
- [ ] Pull Neon console stats — query durations, connection counts
- [ ] Pull UptimeRobot report — uptime percentage since launch
- [ ] Record all metrics in `SUCCESS_METRICS.md`

### User Feedback

- [ ] Review GitHub Issues for any user-reported bugs
- [ ] Check support email / social media mentions for issues
- [ ] Compile list of quick-win improvements for v1.0.1

### Debrief

- [ ] Team debrief call (15–30 min):
  - What went well?
  - What was harder than expected?
  - Any incidents and how they were resolved?
  - Top 3 improvements for next launch
- [ ] Write brief post-launch notes (add to `LAUNCH_READINESS_REPORT.md`):
  ```markdown
  ## Post-Launch Notes (T+24h)
  Date: [DATE]
  Actual launch time: [TIME]
  Readiness score at launch: [SCORE]/100
  
  What went well:
  -
  
  Issues encountered:
  -
  
  Actions taken:
  -
  
  Next steps:
  -
  ```

**Runbook complete. The Chattala is live. 🚀**

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | Abu Md. Selim | *(phone/Discord)* |
| Backup On-Call | *(name)* | *(phone/Discord)* |
| Vercel Support | — | [vercel.com/help](https://vercel.com/help) |
| Neon Support | — | [neon.tech/docs](https://neon.tech/docs) |
| Sentry Support | — | [sentry.io/support](https://sentry.io/support) |

## Useful Commands During Launch

```bash
# Check deployment status
vercel ls

# Pull latest environment variables from Vercel
vercel env pull

# Apply DB migrations (if needed at launch)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Open DB viewer
npx prisma studio

# View recent Vercel logs
vercel logs --app thechattala --since 1h
```

---

*Pre-Launch Runbook v1.0.0 — The Chattala*
*© 2026 [Inievo Technologies](https://inievo.com). Confidential — Internal Use Only.*
