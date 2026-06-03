# Audit Execution Plan

> **Live site:** `https://www.thechattala.com`  
> **Master ops:** [`docs/launch/PHASE_B_OPS.md`](./launch/PHASE_B_OPS.md)

---

## Phase A — Reality sync + quick wins ✅

| Task | Status |
|------|--------|
| A.1 Enterprise docs → `docs/archive/pre-launch/` | ✅ |
| A.2 `joinDate` on email registration | ✅ |
| A.3 `env.ts` production vars required (Zod) | ✅ |
| A.4 Production smoke | ⏳ Run `npm run smoke:production` |

---

## Phase B — Deploy validation 🔄 IN PROGRESS

| Step | Task | Status |
|------|------|--------|
| B.1 | GitHub secrets (`VERCEL_*`, `STAGING_URL`) | ⏳ You — `npm run checklist:github-secrets` |
| B.2 | Staging (Neon branch + Vercel project) | ⏳ You — `npm run setup:staging-branch` |
| B.3 | `CRON_SECRET` + `vercel.json` crons | ⏳ Secret in Vercel; crons ✅ in repo |
| B.4 | Inngest keys + async flags | ⏳ You — Inngest dashboard |
| B.5 | Secret rotation | ⏳ You — `docs/launch/STEP_B5_SECRET_ROTATION.md` |

### Agent deliverables (Phase B code)

- ✅ `vercel.json` cron schedules
- ✅ `npm run verify:staging-env`, `verify:phase-b-env`, `verify:cron-live`
- ✅ Enhanced smoke tests (register route not 500)
- ✅ `docs/launch/PHASE_B_OPS.md` runbook
- ✅ Staging deploy workflow: deploy → then smoke

### Your next commands

```bash
npm run checklist:github-secrets
DEPLOY_URL=https://www.thechattala.com npm run smoke:production
vercel env pull .env.production.local --environment=production
npm run verify:phase-b-env
# After CRON_SECRET in Vercel + redeploy:
DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live
```

---

## Phase C — Role-only RBAC ✅

| Task | Status |
|------|--------|
| C.1 Drop `isAdmin` column + backfill `role` | ✅ |
| C.2 Auth/session/guards use `role` only | ✅ |
| C.3 Admin API + UI PATCH `{ role }` | ✅ |
| C.4 Seeds + tests updated | ✅ |
| C.5 Pin `next-auth@5.0.0-beta.31` | ✅ |
| C.6 Production migration | ⏳ You — `npx prisma migrate deploy` |

Runbook: [`docs/launch/PHASE_C_OPS.md`](./launch/PHASE_C_OPS.md)

---

## Phase D — Coverage + layout split ✅

| Task | Status |
|------|--------|
| D.1 API integration tests → 60%+ coverage | ✅ |
| D.2 Coverage gate raised in `vitest.config.ts` | ✅ |
| D.3 `DashboardLayout` split into modules | ✅ |
| D.4 Admin route `any` cleanup (priority paths) | ✅ |

Runbook: [`docs/launch/PHASE_D_OPS.md`](./launch/PHASE_D_OPS.md)

---

## Phase E — Fee Decimal + indexes ✅

| Task | Status |
|------|--------|
| E.1 `ExpertService.fee` + `ServiceBooking.fee` → Decimal | ✅ |
| E.2 Fee parse/serialize utilities + API updates | ✅ |
| E.3 `Message(conversationId, createdAt)` index | ✅ |
| E.4 `Order(status, createdAt)` index | ✅ |
| E.5 Production migration | ⏳ You — `npx prisma migrate deploy` |

Runbook: [`docs/launch/PHASE_E_OPS.md`](./launch/PHASE_E_OPS.md)

---

## Phase F — GO + first 10 users 🔄

| Task | Status |
|------|--------|
| F.1 GO sign-off checklist + verify script | ✅ |
| F.2 First 10 users playbook | ✅ |
| F.3 Lead sign-offs | ⏳ You — [`GO_SIGNOFF_CHECKLIST.md`](./launch/GO_SIGNOFF_CHECKLIST.md) |
| F.4 Pending ops (migrations, crons, DR) | ⏳ You — Phase B + C + E runbooks |
| F.5 Invite 10 real users | ⏳ You — [`FIRST_10_USERS.md`](./launch/FIRST_10_USERS.md) |

Runbook: [`docs/launch/PHASE_F_OPS.md`](./launch/PHASE_F_OPS.md)

**Audit plan code phases A–F: agent work complete.** Remaining items are ops + human sign-off.
