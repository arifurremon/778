# Launch Execution — Step-by-Step (Audit → GO)

> **Purpose:** June 2026 audit-এর বাকি ops + validation কাজ **ধাপে ধাপে** শেষ করা।  
> **Master checklist:** `docs/DEFERRED_POST_COMPLETION_TASKS.md`  
> **Audit plan:** `docs/AUDIT_EXECUTION_PLAN.md`  
> **Phase F runbook:** [`PHASE_F_OPS.md`](./PHASE_F_OPS.md)  
> **Status:** Phase F — GO sign-off + first 10 users (ops pending)

---

## Progress tracker

| Step | Block | Owner | Done |
|------|-------|-------|------|
| **1** | [Vercel cutover (A.1–A.7)](./STEP_01_VERCEL_CUTOVER.md) | You + Vercel | [x] |
| **2** | [Post-deploy smoke (A.8)](./STEP_02_POST_DEPLOY_SMOKE.md) | You | [ ] |
| **3** | [Phase B — Staging + crons + Inngest](./PHASE_B_OPS.md) | You + Agent | [ ] **in progress** |
| **4** | GitHub secrets (B.1) | You | [ ] |
| **5** | [GO sign-off + first 10 users](./PHASE_F_OPS.md) | Leads | [ ] **current** |

### Code phases (parallel)

| Phase | Item | Status |
|-------|------|--------|
| **A** | joinDate, env.ts, doc archive | ✅ Done |
| **B** | Crons in repo, verify scripts, smoke | ✅ Agent done — ops pending |
| **C** | isAdmin → role; next-auth pin | ✅ Agent done — prod migration pending |
| **D** | Coverage 60%, DashboardLayout split | ✅ Agent done |
| **E** | Fee Decimal + perf indexes | ✅ Agent done — prod migration pending |
| **F** | GO sign-off + first 10 users | ✅ Agent done — sign-offs pending |

---

## Quick commands

```bash
# Phase A.4 / B validation
DEPLOY_URL=https://www.thechattala.com npm run smoke:production

# Phase B — Staging + crons + Inngest
npm run checklist:github-secrets
npm run verify:phase-b-env
DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live

# Phase F — GO readiness
npm run verify:go-readiness
DEPLOY_URL=https://www.thechattala.com npm run verify:go-readiness
```

---

## Related docs

- [`PHASE_F_OPS.md`](./PHASE_F_OPS.md) — **GO + first 10 users**
- [`GO_SIGNOFF_CHECKLIST.md`](./GO_SIGNOFF_CHECKLIST.md)
- [`FIRST_10_USERS.md`](./FIRST_10_USERS.md)
- [`STEP_B5_SECRET_ROTATION.md`](./STEP_B5_SECRET_ROTATION.md)
- [`../STAGING_ENVIRONMENT.md`](../STAGING_ENVIRONMENT.md)
- [`../AUDIT_EXECUTION_PLAN.md`](../AUDIT_EXECUTION_PLAN.md)
