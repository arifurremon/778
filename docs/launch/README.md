# Launch Execution — Step-by-Step (Audit → GO)

> **Purpose:** June 2026 audit-এর বাকি ops + validation কাজ **ধাপে ধাপে** শেষ করা।  
> **Master checklist:** `docs/DEFERRED_POST_COMPLETION_TASKS.md`  
> **Status:** Step 1 in progress

---

## Progress tracker

| Step | Block | Owner | Agent prep | Your action | Done |
|------|-------|-------|------------|-------------|------|
| **1** | [Vercel cutover (A.1–A.7)](./STEP_01_VERCEL_CUTOVER.md) | You + Vercel | ✅ Scripts + runbook | Console + DNS | [ ] |
| **2** | Post-deploy smoke (A.8) | You | ✅ `npm run smoke:production` | Run on live URL | [ ] |
| **3** | Staging environment (B) | You | — (Step 3 runbook next) | Neon branch + Vercel staging | [ ] |
| **4** | GitHub secrets (C.6) | You | — | Update `VERCEL_*` secrets | [ ] |
| **5** | Crons + webhooks (Phase 6) | You | `vercel.json` crons when ready | `CRON_SECRET` + deploy | [ ] |
| **6** | Inngest async (Phase 7) | You | — | Keys + feature flags | [ ] |
| **7** | DR drills (Phase 4) | You | `npm run drill:smoke` | Neon PITR + rollback | [ ] |
| **8** | Validation ops (Phase 9) | Agent + You | CI workflows exist | k6, ZAP, Lighthouse, E2E | [ ] |
| **9** | GO sign-off | Leads | — | `LAUNCH_READINESS_REPORT.md` | [ ] |

### Code backlog (parallel — post Step 2)

| Phase | Item | When |
|-------|------|------|
| 4 | D-H1b — coverage 60%+ | After staging live |
| 5 | D-H4b — remaining `any` cleanup | After staging live |
| 6 | D-M1–M8 — medium items | Post-launch sprints |

---

## Quick commands

```bash
# After: vercel env pull .env.production.local --environment=production
npm run verify:production-env

# After first deploy (replace URL)
DEPLOY_URL=https://www.thechattala.com npm run smoke:production

# Legacy alias (same script)
STAGING_URL=https://www.thechattala.com npm run smoke:staging
```

---

## Related docs

- `docs/DEFERRED_POST_COMPLETION_TASKS.md` — full audit backlog
- `docs/DEPLOYMENT_ENV.md` — env var reference
- `docs/STAGING_ENVIRONMENT.md` — Step 3 guide
- `docs/runbooks/DR_DRILL_GUIDE_BN.md` — Step 7
- `LAUNCH_READINESS_REPORT.md` — final GO/NO-GO
