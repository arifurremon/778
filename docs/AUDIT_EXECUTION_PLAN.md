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

## Phase C–F (backlog)

| Phase | Focus |
|-------|--------|
| **C** | `isAdmin` → `role` only; next-auth stable |
| **D** | Coverage 60%; `any` cleanup; DashboardLayout split |
| **E** | `ExpertService.fee` Decimal; indexes / perf |
| **F** | GO sign-off + first 10 real users |

See [`DEFERRED_POST_COMPLETION_TASKS.md`](./DEFERRED_POST_COMPLETION_TASKS.md).
