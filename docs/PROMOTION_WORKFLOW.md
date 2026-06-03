# Production Promotion Workflow

> **Phase 8.2** — Staging smoke → manual approve → production deploy.

---

## Principles

1. **Nothing reaches production without staging smoke passing.**
2. **Production deploy requires explicit human approval** (GitHub `production` environment).
3. **Database migrations** are tested on staging Neon branch before promotion.
4. **Rollback** plan documented in `docs/DEPLOYMENT.md`.

---

## Promotion checklist

### Before promotion

- [ ] All Phase exit criteria for current release met on `staging`
- [ ] `npm run validate && npm run build` green on `staging` branch
- [ ] Staging smoke passed: `STAGING_URL=https://... bash scripts/staging-smoke.sh`
- [ ] E2E optional on staging: `npm run test:e2e` with staging base URL
- [ ] No open P0/P1 incidents
- [ ] `LAUNCH_READINESS_REPORT.md` updated if launch milestone

### During promotion

1. Open **Actions → Promote to Production → Run workflow**
2. Enter **staging URL** (must match live staging deploy)
3. Optional: **release tag** (e.g. `v1.3.0`)
4. Wait for **staging-smoke** job ✅
5. **Approver** reviews diff staging→main and approves `production` environment
6. **deploy-production** runs Vercel prod deploy (if secrets configured)
7. Run production smoke (same script with prod URL)

### After promotion

- [ ] Verify `/api/v1/health` on production
- [ ] Check Sentry for new error spikes (15 min window)
- [ ] Merge `staging` → `main` if not already aligned
- [ ] Tag release: `git tag v1.x.y && git push origin v1.x.y`
- [ ] Update status page if needed

---

## Automated workflow

File: `.github/workflows/promote-production.yml`

```
workflow_dispatch
  ├── staging-smoke     (scripts/staging-smoke.sh)
  ├── production-approval  (GitHub environment gate)
  ├── deploy-production    (Vercel CLI, optional)
  └── merge-to-main        (documentation step)
```

### Manual smoke (local or CI)

```bash
export STAGING_URL=https://your-staging-url.vercel.app
npm run smoke:staging
```

---

## Rollback

If production deploy fails smoke or Sentry alerts fire:

1. **Vercel:** Project → Deployments → previous deployment → **Promote to Production**
2. **Database:** Neon PITR restore to branch (see `docs/runbooks/DR_DRILL_GUIDE_BN.md`)
3. File incident using `docs/INCIDENT_RESPONSE.md`
4. Post-mortem within 48h for P1/P2

---

## Environment mapping

| Step | Environment | Gate |
|------|-------------|------|
| Feature dev | local / preview | PR CI |
| QA | staging | staging-deploy.yml |
| Production | main + tag | promote-production.yml + approver |

---

## Escalation

See [On-Call Rotation](./ON_CALL_ROTATION.md) if promotion causes production incident.
