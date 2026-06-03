# Audit Execution Plan — Phase A Complete → Phase B Next

> **Created:** June 2026 (external audit response)  
> **Live site:** `https://www.thechattala.com`

## Phase A — Reality sync + quick wins ✅

| Task | Status |
|------|--------|
| A.1 Enterprise docs → `docs/archive/pre-launch/` | ✅ |
| A.2 `joinDate` on email registration | ✅ |
| A.3 `env.ts` production vars required (Zod) | ✅ |
| A.4 Production smoke | ⏳ **Your action** — see below |

### A.4 — Run now

```bash
vercel env pull .env.production.local --environment=production
npm run verify:production-env
DEPLOY_URL=https://www.thechattala.com npm run smoke:production
```

Manual: register → verify email → login → dashboard.

---

## Phase B — Deploy validation (next)

| Step | Task |
|------|------|
| B.1 | GitHub secrets refresh (`VERCEL_*`) |
| B.2 | Staging environment (Neon branch + Vercel) |
| B.3 | `CRON_SECRET` + Vercel crons |
| B.4 | Inngest keys + async flags |
| B.5 | Rotate secrets exposed in chat |

See [`docs/launch/README.md`](./launch/README.md).

---

## Phase C–F (backlog)

| Phase | Focus |
|-------|--------|
| **C** | `isAdmin` → `role` only; next-auth stable |
| **D** | Coverage 60%; `any` cleanup; DashboardLayout split |
| **E** | `ExpertService.fee` Decimal; indexes / perf |
| **F** | GO sign-off + first 10 real users |

Full detail: conversation plan + [`DEFERRED_POST_COMPLETION_TASKS.md`](./DEFERRED_POST_COMPLETION_TASKS.md).
