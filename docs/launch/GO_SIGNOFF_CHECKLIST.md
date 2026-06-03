# GO Sign-Off Checklist — Phase F

> **Production:** `https://www.thechattala.com`  
> **Decision date:** _______________  
> **Rule:** Engineering + Security + Product leads must all mark **GO** before public announcement.

---

## Automated gates (run today)

```bash
npm run verify:go-readiness
DEPLOY_URL=https://www.thechattala.com npm run verify:go-readiness
npx prisma migrate deploy   # on production Neon — Phase C + E
```

| Check | Command | Pass | Owner | Date |
|-------|---------|------|-------|------|
| Local CI green | `npm run verify:go-readiness` | [ ] | | |
| Production smoke | `DEPLOY_URL=... npm run smoke:production` | [ ] | | |
| Migrations applied | `npx prisma migrate status` on prod | [ ] | | |
| Cron jobs live | `npm run verify:cron-live` | [ ] | | |
| Env vars complete | `npm run verify:phase-b-env` | [ ] | | |

---

## Code phases A–E (agent complete ✅)

| Phase | Deliverable | Verified |
|-------|-------------|----------|
| A | joinDate, env.ts, doc archive | [x] |
| B | Crons, verify scripts, smoke | [x] code — [ ] ops |
| C | role-only RBAC, drop isAdmin | [x] code — [ ] prod migration |
| D | 60% coverage, dashboard split | [x] |
| E | Decimal fees, pagination indexes | [x] code — [ ] prod migration |

---

## Security & compliance (manual)

| Item | Pass | Notes |
|------|------|-------|
| `AUTH_SECRET` rotated post-cutover | [ ] | |
| Admin MFA policy documented | [ ] | `ADMIN_MFA_REQUIRED` |
| Privacy + Terms pages live | [ ] | `/privacy`, `/terms` |
| CSRF on all mutations verified | [ ] | |
| No open Critical pentest findings | [ ] | `docs/security/PENTEST_REPORT.md` |
| Secret rotation (Phase B.5) | [ ] | `STEP_B5_SECRET_ROTATION.md` |

---

## Reliability (manual)

| Item | Pass | Notes |
|------|------|-------|
| Neon automatic backups enabled | [ ] | Neon Console |
| PITR drill executed + RTO/RPO logged | [ ] | `LAUNCH_READINESS_REPORT.md` |
| Hosting rollback drill (< 5 min) | [ ] | Vercel Promote Previous |
| Uptime monitor on `/api/health` | [ ] | UptimeRobot / Better Stack |
| Sentry receiving production events | [ ] | Test error once |
| On-call primary + backup named | [ ] | `docs/runbooks/` |

---

## Product readiness

| Item | Pass | Notes |
|------|------|-------|
| Admin can moderate posts/users | [ ] | `/admin` |
| Email verification flow works | [ ] | Brevo SMTP |
| Register → login → dashboard E2E | [ ] | Manual on prod |
| Marketplace + services browse OK | [ ] | Smoke + manual |
| Support channel ready (WhatsApp/email) | [ ] | |
| Status page linked in footer | [ ] | `/status` |

---

## Lead sign-offs

| Role | Name | GO / NO-GO | Date | Signature |
|------|------|------------|------|-----------|
| **Engineering Lead** | Abu Md. Selim | [ ] GO  [ ] NO-GO | | |
| **Security Lead** | | [ ] GO  [ ] NO-GO | | |
| **Product Lead** | | [ ] GO  [ ] NO-GO | | |
| **DevOps Lead** | | [ ] GO  [ ] NO-GO | | |

**Unanimous GO** from Engineering, Security, and Product required.

After all boxes checked → update `LAUNCH_READINESS_REPORT.md` status to **GO** and proceed to [First 10 Users](./FIRST_10_USERS.md).

---

## Post-GO announcement (do not skip)

- [ ] Post seeded community welcome content (admin)
- [ ] Send personal invites to first 10 users
- [ ] Monitor Sentry + `/api/health` for 72 hours (`SUCCESS_METRICS.md` Tier 1)
- [ ] Daily standup reviewing registration + error rate
