# Phase F — GO Sign-Off + First 10 Users

> **Prerequisite:** Phases A–E code complete; production live at `https://www.thechattala.com`  
> **Goal:** Formal GO decision + onboard 10 real verified users.

---

## Agent deliverables (Phase F)

| Artifact | Purpose |
|----------|---------|
| [`GO_SIGNOFF_CHECKLIST.md`](./GO_SIGNOFF_CHECKLIST.md) | Lead sign-off form |
| [`FIRST_10_USERS.md`](./FIRST_10_USERS.md) | Invite + tracker playbook |
| `npm run verify:go-readiness` | Local CI + optional prod smoke |
| Updated `LAUNCH_READINESS_REPORT.md` | Current readiness snapshot |

---

## Your execution order

### Step 1 — Engineering verification (30 min)

```bash
npm run verify:go-readiness
DEPLOY_URL=https://www.thechattala.com npm run verify:go-readiness
```

All local gates must pass. Remote smoke requires `DEPLOY_URL`.

### Step 2 — Finish pending ops (Phase B + migrations)

```bash
npx prisma migrate deploy                    # Phase C + E on production Neon
npm run checklist:github-secrets
vercel env pull .env.production.local --environment=production
npm run verify:phase-b-env
DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live
```

See also [`PHASE_B_OPS.md`](./PHASE_B_OPS.md), [`PHASE_C_OPS.md`](./PHASE_C_OPS.md), [`PHASE_E_OPS.md`](./PHASE_E_OPS.md).

### Step 3 — Manual GO checklist

Open [`GO_SIGNOFF_CHECKLIST.md`](./GO_SIGNOFF_CHECKLIST.md) and complete every row.

**Unanimous GO** required from Engineering, Security, and Product leads.

### Step 4 — Update launch report

Edit `LAUNCH_READINESS_REPORT.md`:

- Set **Launch Status** to `[x] GO` (when ready)
- Update readiness score (see Phase F section added by agent)
- Fill sign-off table with dates

### Step 5 — First 10 users (Week 1)

Follow [`FIRST_10_USERS.md`](./FIRST_10_USERS.md):

1. Seed welcome content
2. Send personal invites (not public link)
3. Track registration / verification in tracker table
4. Monitor Sentry + uptime for 72 hours

---

## GO decision criteria (summary)

| Must be true | How to verify |
|--------------|---------------|
| `npm run verify:go-readiness` passes | Automated |
| Production smoke 11/11 | `npm run smoke:production` |
| Migrations deployed | `prisma migrate status` |
| No open Critical security items | Pentest report |
| Lead sign-offs complete | GO_SIGNOFF_CHECKLIST |
| On-call + backup assigned | Runbooks |

---

## Current engineering status (June 2026)

| Area | Status |
|------|--------|
| Tests | **319** Vitest tests, CI green |
| Coverage | **≥60%** API gate (Phase D) |
| RBAC | Role-only, no `isAdmin` (Phase C) |
| Fees | Decimal in DB (Phase E) |
| Production URL | Live — `www.thechattala.com` |
| Blockers | Ops-only: migrations, crons, Inngest, DR drill, sign-offs |

---

## After Phase F

The audit execution plan is **complete**. Ongoing work moves to:

- `SUCCESS_METRICS.md` — 30-day monitoring
- `docs/DEFERRED_POST_COMPLETION_TASKS.md` — post-100-user enterprise items
- Wider public launch when Tier 1 metrics hold for 72 hours

---

## Quick reference

```bash
# Full GO check
npm run verify:go-readiness
DEPLOY_URL=https://www.thechattala.com npm run verify:go-readiness

# Production smoke only
DEPLOY_URL=https://www.thechattala.com npm run smoke:production

# Track users (Neon SQL)
# See FIRST_10_USERS.md queries
```
