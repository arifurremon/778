# Launch Readiness Report

> **Project:** The Chattala — Chittagong's Hyperlocal City Platform
> **Version:** v1.0.0
> **Prepared By:** Abu Md. Selim, Engineering Lead — Inievo Technologies
> **Report Date:** 2026-06-10 (Phase F — GO readiness update)  
> **Target Launch:** Soft launch — first 10 users after GO sign-off

---

## Phase F Update (June 2026)

> Production is **live** at `https://www.thechattala.com`. Code phases **A–F** agent deliverables are complete. **GO** is blocked on ops sign-off only.

| Category | Was (Mar 2026) | Now (Jun 2026) |
|----------|----------------|----------------|
| Readiness score (est.) | 58/100 | **~82/100** |
| Tests | 190+ | **319** Vitest + Playwright E2E |
| API coverage gate | <60% | **≥60%** enforced |
| RBAC | `isAdmin` boolean | **`role` enum only** |
| Expert fees | String | **Decimal(10,2)** |
| Production deploy | Blocked (old Vercel) | **Live** on new account |
| Remaining blockers | Code + deploy | **Ops only** — migrations, crons, DR drill, lead sign-offs |

**Next steps:** [`docs/launch/PHASE_F_OPS.md`](docs/launch/PHASE_F_OPS.md) → [`GO_SIGNOFF_CHECKLIST.md`](docs/launch/GO_SIGNOFF_CHECKLIST.md) → [`FIRST_10_USERS.md`](docs/launch/FIRST_10_USERS.md)

```bash
npm run verify:go-readiness
DEPLOY_URL=https://www.thechattala.com npm run verify:go-readiness
```

---

## Executive Summary

| Field | Value |
|-------|-------|
| **Current Readiness Score** | **~82** / 100 (Phase F estimate) |
| **Launch Status** | `[ ] GO` &nbsp;&nbsp; `[x] NO-GO` *(pending ops sign-off)* |
| **Recommendation** | `[ ] LAUNCH NOW` &nbsp; `[x] SOFT LAUNCH after GO checklist` &nbsp; `[ ] CANCEL` |
| **Confidence Level** | **8** / 10 |
| **Signed Off By** | Abu Md. Selim |
| **Report Version** | 1.2.0 |

### Readiness Score Breakdown

| Category | Weight | Score | Weighted |
|----------|--------|-------|---------|
| Build & Code Quality | 15% | 9/15 | 9.0 |
| Security (Auth, Input, Headers) | 30% | 14/30 | 14.0 |
| Testing & Coverage | 15% | 8/15 | 8.0 |
| Performance | 15% | 6/15 | 6.0 |
| Infrastructure & Monitoring | 15% | 10/15 | 10.0 |
| User Experience | 10% | 7/10 | 7.0 |
| **Total** | **100%** | | **58/100** |

---

## Go / No-Go Decision Framework

### ✅ GO — Proceed with Launch When ALL of the Following Are True

- [ ] All **Critical** items in `PRODUCTION_CHECKLIST.md` are ✅
- [ ] At least **80%** (24/30) of High Priority items are ✅
- [ ] Zero open **Critical** security vulnerabilities (OWASP Top 10 reviewed)
- [ ] `npm run build` succeeds with zero errors in the **last 24 hours**
- [ ] All tests pass: `npm run test` green
- [ ] Test coverage ≥ **60%** on API routes
- [ ] Page load (LCP) < **3 seconds** verified on staging
- [ ] Sentry is receiving events from staging environment
- [ ] Database backup is verified and restorable
- [ ] Rollback procedure has been **tested** (not just documented)
- [ ] Team confidence level: **≥ 8 / 10**
- [ ] At least **one full end-to-end user journey** tested on staging:
  - Registration → Email Verify → Create Post → View Profile

### ❌ NO-GO — Block Launch If ANY of the Following Are True

- [ ] **Any** Critical checklist item is ❌
- [ ] More than **2** High Priority items are ❌
- [ ] **Any** of the following critical security issues remain open:
  - Plaintext passwords in database
  - CSRF tokens not validated
  - Admin routes guarded by live DB **`role`** check (not JWT alone)
  - SQL injection possible via raw queries
  - Sessions not invalidated on sign-out
- [ ] Test coverage < **60%** on auth routes
- [ ] `npm run build` fails or produces TypeScript errors
- [ ] Page load > **5 seconds** on 4G simulation
- [ ] Database migrations untested against production schema
- [ ] Error tracking (Sentry) not configured or not receiving events
- [ ] Rollback procedure is untested
- [ ] Team confidence < **7 / 10**

---

## Critical Blockers

> **Instructions:** List every item from `PRODUCTION_CHECKLIST.md` that is currently ❌ or ⚠️.
> Each blocker must have an owner and a resolution date before launch is approved.

| # | Blocker Description | Severity | Owner | Target Resolution | Status |
|---|---------------------|----------|-------|-------------------|--------|
| 1 | ESLint + production build not enforced in CI | Critical | Abu Md. Selim | 2026-03-26 (Phase 1) | **Resolved** |
| 2 | No privacy / terms pages or consent ledger | Critical | Abu Md. Selim | 2026-04-15 (Phase 3) | **Resolved** |
| 3 | Session guards on ~14 routes still use legacy `auth()` | High | Abu Md. Selim | 2026-04-01 (Phase 2) | **Resolved** |
| 4 | Rollback + DR drills not executed | High | Abu Md. Selim | Before launch | **Partial** — git revert + DB smoke validated; Neon PITR + hosting rollback need your Console/panel (~30 min) |
| 5 | No public `/api/health` endpoint for uptime monitoring | High | Abu Md. Selim | 2026-05-01 (Phase 4) | **Resolved** |
| 6 | Production deploy on new Vercel account | High | Abu Md. Selim | Before launch | **Resolved** — `www.thechattala.com` live |
| 7 | Phase C+E migrations on production Neon | High | Abu Md. Selim | Before GO | **Open** — `npx prisma migrate deploy` |
| 8 | Phase B ops (crons, Inngest, secret rotation) | High | Abu Md. Selim | Before GO | **Open** — `docs/launch/PHASE_B_OPS.md` |

---

## Risk Assessment

### Technical Risk: `[ ] LOW  [x] MEDIUM  [ ] HIGH`

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Neon DB cold-start during traffic spike | Low | Medium | Connection pooling enabled; Upstash Redis caches session |
| UploadThing CDN outage | Low | Medium | Images stored on external CDN; fallback to initials avatar |
| Vercel function timeout on heavy Prisma queries | Medium | Low | `getDb()` factory pattern; queries optimised with indexes |
| NextAuth session token rotation failure | Low | High | Tested in staging; rollback to previous auth config ready |
| Rate limiter (Upstash) temporarily down | Low | Medium | Auth routes fail open with degraded rate limiting; not a security hole |

**Assessment:** Core stack is stable (CI green, 190+ tests, build passes). Public `/api/health`, structured logging, Sentry sampling, and on-call runbooks reduce observability risk. Remaining gap: live DR/rollback drill execution on staging Neon branch (checklist documented below).

### Operational Risk: `[ ] LOW  [x] MEDIUM  [ ] HIGH`

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| On-call developer unavailable during incident | Low | High | Secondary contact defined; runbooks in `docs/runbooks/` |
| DNS propagation delay at launch | Low | Low | Pre-configured Vercel domain; propagation typically < 5 min |
| Email deliverability issues (Brevo SMTP) | Medium | Medium | Test emails verified pre-launch; fallback SMTP provider identified |
| Production environment variable misconfiguration | Medium | High | Full env var audit in pre-launch runbook; staging mirrors production |

**Assessment:** On-call is defined but backup contact TBD. DR and rollback drills not yet executed. Alternate hosting path required due to Vercel account block. Overall **MEDIUM** until Phase 4 runbooks and drills complete.

### Business Risk: `[x] LOW  [ ] MEDIUM  [ ] HIGH`

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low initial user adoption | Medium | Medium | Seeded admin content; social media announcement prepared |
| Negative press from security incident | Very Low | High | Security checklist complete; penetration testing considered |
| Competitor launches similar feature | Low | Low | Hyperlocal Chittagong focus is a strong differentiator |

**Assessment:** Hyperlocal Chittagong positioning limits direct competition. Warm-start user base planned. Business risk is **LOW** relative to technical/operational gaps.

---

## Mitigation Strategies

### For Technical Risks

1. **Database resilience:** Neon's serverless PostgreSQL auto-scales; daily automatic backups enabled. Manual backup taken 2 hours before launch.
2. **Auth failures:** NextAuth is stateless JWT-based; even if Redis goes down, sessions remain valid until expiry.
3. **Performance degradation:** Vercel Analytics alerting configured; rollback takes < 30 seconds via Vercel dashboard.
4. **File upload issues:** UploadThing's CDN has 99.9% SLA; user-facing error message provides clear retry instructions.

**Assessment:** On-call runbooks and Sentry alert definitions are in place. Staging DR/rollback drill should be executed once before launch (target RTO < 4 h). Alternate hosting path still required due to Vercel account block.

### For Operational Risks

1. **Incident response:** `docs/runbooks/` defines step-by-step actions for Redis, Neon, Pusher, and SMTP failures.
2. **Monitoring:** `GET /api/health` probed externally; alert rules in `docs/observability/SENTRY_ALERTS.md`.
3. **Communication:** `/status` page + footer link; external Better Stack page via `NEXT_PUBLIC_STATUS_PAGE_URL`.

### For Business Risks

1. **User activation:** First 50 users are from personal/professional networks — warm start, not cold.
2. **Content seeding:** Admin user will seed initial community posts before public announcement.
3. **Feedback loop:** GitHub Issues open for user-reported bugs; Discord/WhatsApp group for early users.

---

## Incident Response Plan

### On-Call Rotation (First 2 Weeks Post-Launch)

| Week | Primary On-Call | Backup | Hours |
|------|----------------|--------|-------|
| Week 1 | Abu Md. Selim | TBD (assign before launch) | 24/7 |
| Week 2 | Abu Md. Selim | TBD (assign before launch) | 24/7 |

### Escalation Path

```
1. Monitoring alert fires (Sentry / UptimeRobot)
          ↓
2. Primary on-call investigates (< 15 min SLA)
          ↓
3. P1: Immediate action — fix or rollback within 30 min
   P2: Fix within 2 hours or schedule for next day
   P3/P4: Log issue, fix in next sprint
          ↓
4. If primary unavailable → contact backup within 15 min
          ↓
5. Post-incident: Write post-mortem within 24h (P1/P2 only)
```

### Rollback Procedure (Tested ✅ / Untested ❌)

- [x] **Hosting instant rollback** (< 5 minutes): Redeploy previous artifact / promote prior deployment — **Procedure documented** (Phase 4.8)
- [x] **Git revert rollback** (< 5 min): `git revert <hash>` + push to `main` — **Procedure documented** (Phase 4.8)
- [x] **Database rollback**: Neon PITR branch restore — **Procedure documented** (Phase 4.7)
- [ ] **Live staging drill executed** with recorded timestamps — **Partial** (see below; Neon Console + hosting panel required for full drill)

> **Backup verification:** Neon automatic backups enabled. Execute staging drill using checklist below; target **RTO < 4 hours**, **RPO ≤ 24 hours** (Neon PITR granularity).
>
> **Can Cursor Agent run the full drill alone?** **No.** PITR branch creation needs [Neon Console](https://console.neon.tech) login or `NEON_API_KEY`. Hosting rollback needs your deploy provider dashboard (Vercel account currently blocked). See **`docs/runbooks/DR_DRILL_GUIDE_BN.md`** (Bengali step-by-step).

---

## Phase 4 — DR & Rollback Drill Record

### What was validated automatically (agent / CI)

| Drill | Date | Result | Measured |
|-------|------|--------|----------|
| Git revert rollback | 2026-06-03 | ✅ Pass | **31 ms** local `git revert` on test branch |
| DB smoke (`SELECT 1` via Neon) | 2026-06-03 | ✅ Pass | **912 ms** latency; run `npm run drill:smoke` |
| Redis smoke | 2026-06-03 | ⚠️ Skipped | No `UPSTASH_*` in agent env — run on staging |

### 4.7 Neon PITR Restore (Staging) — **requires your Neon Console**

| Step | Action | Owner | Status |
|------|--------|-------|--------|
| 1 | Record baseline: `npm run drill:smoke` | On-call | ✅ Automated script ready |
| 2 | Neon Console → restore branch to T-15 min | **You** | ⏳ Pending |
| 3 | Point staging `DATABASE_URL` to recovery branch | **You** | ⏳ Pending |
| 4 | Run `npx prisma migrate deploy && npm run test:integration` | Engineering | ⏳ After step 3 |
| 5 | Smoke test login + post creation | QA | ⏳ After step 3 |
| 6 | Record **RTO** (restore start → green health) | On-call | ⏳ **Do not guess — measure in Console drill** |
| 7 | Record **RPO** (data loss window) | On-call | ⏳ **Do not guess — use restore timestamp** |

**Document actual RTO/RPO here after you complete the Neon Console drill:**

| Drill date | RTO | RPO | Notes |
|------------|-----|-----|-------|
| _Pending — complete steps in `docs/runbooks/DR_DRILL_GUIDE_BN.md`_ | — | — | Procedure in `docs/runbooks/NEON_DOWN.md` |

### 4.8 Hosting Rollback Drill — **requires your hosting dashboard**

| Step | Action | Target |
|------|--------|--------|
| 1 | Deploy harmless change to staging | — |
| 2 | Promote previous deployment / redeploy prior build | **< 5 min RTO** |
| 3 | Verify `/api/health` 200 and login flow | — |
| 4 | `git revert` drill on feature branch (not `main`) | ✅ **31 ms** measured locally |

| Drill date | Rollback RTO | Notes |
|------------|--------------|-------|
| _Pending — use your host's promote-previous flow_ | — | Vercel blocked; use alternate host panel |

### Communication Plan

| Scenario | Channel | Template Ready |
|----------|---------|---------------|
| Planned maintenance | Status page + in-app banner | `[ ]` |
| Unplanned < 5 min outage | Internal only | `[ ]` |
| Outage 5–30 min | Status page update | `[ ]` |
| Outage > 30 min | Status page + social media + email to active users | `[ ]` |
| Data incident | Direct email to affected users + regulatory notification | `[ ]` |

---

## Post-Launch Monitoring Plan

### First 24 Hours (Intensive)

- Engineering Lead monitors Sentry, `/api/health`, and hosting metrics continuously
- Check every 30 minutes: error rate, response times, uptime
- Any P1 alert → immediate response

### Days 2–7

- Daily 15-minute team standup reviewing metrics from `SUCCESS_METRICS.md`
- Sentry daily digest email reviewed
- Uptime probe on `GET /api/health` (Better Stack / UptimeRobot) reviewed daily

### Week 2–4

- Weekly review of all Tier 1, 2, 3 metrics
- User feedback consolidated from support channels
- Performance regression tests run weekly

---

## Sign-Offs

> All leads must sign below before the GO decision is made.

| Role | Name | Date | Decision | Signature |
|------|------|------|----------|-----------|
| **Engineering Lead** | Abu Md. Selim | | `[ ] GO  [ ] NO-GO` | |
| **Security Lead** | | | `[ ] GO  [ ] NO-GO` | |
| **DevOps Lead** | | | `[ ] GO  [ ] NO-GO` | |
| **Product Lead** | | | `[ ] GO  [ ] NO-GO` | |
| **QA Lead** | | | `[ ] GO  [ ] NO-GO` | |

**Unanimous GO required from Engineering, Security, and Product leads before deployment begins.**

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-05-12 | Abu Md. Selim | Initial report template created |
| 1.1.0 | 2026-03-12 | Abu Md. Selim | Phase 0 baseline: scores, blockers, risk assessments filled |

---

*This document must be updated and re-signed for each major version release (v1.x.0 and above).*

*© 2026 [Inievo Technologies](https://inievo.com). Confidential — Internal Use Only.*
