# Pre-Launch Runbook

> **Purpose:** Step-by-step execution guide for the 24 hours leading up to, and immediately following, the production launch of The Chattala v1.0.0.
>
> **Execute this runbook in order.**
>
> **Primary Executor:** Abu Md. Selim (Engineering Lead)
> **Launch Window:** *(fill in: e.g., 2026-05-15 at 10:00 AM BST)*

---

## Pre-Requisites

- [ ] `PRODUCTION_CHECKLIST.md` fully reviewed
- [ ] `LAUNCH_READINESS_REPORT.md` signed off
- [ ] Staging environment verified to mirror production
- [ ] Team notified of launch window

---

## T-24 Hours: Final Validation

### Code & Build
- [ ] `git pull origin main`
- [ ] `npm run build` — zero errors
- [ ] `npm run typecheck` — 0 TypeScript errors
- [ ] `npm run lint` — 0 errors

### Tests
- [ ] `npm run test` — all pass, coverage ≥ 60%
- [ ] `npm run test:integration` — Auth + Post tests green
- [ ] `npm run test:e2e` — all Playwright tests pass

### Security Audit
- [ ] No `.env` files committed to Git
- [ ] `AUTH_SECRET` is ≥ 32 chars
- [ ] `NEXTAUTH_URL` = `https://www.thechattala.com`
- [ ] securityheaders.com rating: **A** or **A+**

---

## T-4 Hours: Infrastructure & Team Prep

### Database
- [ ] Manual DB backup via Neon Console (create branch `backup-pre-launch-YYYYMMDD`)
- [ ] `npx prisma migrate status` → "Database schema is up to date"

### Monitoring
- [ ] Sentry receiving test events
- [ ] UptimeRobot monitor active
- [ ] Vercel Analytics enabled

---

## T-0: Launch Execution

```bash
# Deploy to production
git push origin main
# OR
vercel --prod
```

### Smoke Tests (on production)
- [ ] Home page loads
- [ ] Registration works end-to-end
- [ ] Login with credentials works
- [ ] Create a post works
- [ ] Profile page loads
- [ ] Admin panel accessible
- [ ] Password reset email arrives

### Launch Decision
```
All smoke tests pass AND error rate < 0.5%?
  → ✅ LAUNCH CONFIRMED

Any failure OR error rate > 1%?
  → ❌ ABORT — trigger rollback
```

### Rollback Procedure
```
1. vercel.com → thechattala → Deployments
2. Find previous successful deployment
3. Click ⋯ → "Promote to Production"
4. Notify team immediately
```

---

## Useful Commands

```bash
vercel ls
vercel env pull
npx prisma migrate deploy
npx prisma migrate status
npx prisma studio
vercel logs --app thechattala --since 1h
```

---

*Pre-Launch Runbook v1.0.0 — The Chattala*
