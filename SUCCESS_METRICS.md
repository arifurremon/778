# Success Metrics — The Chattala v1.0.0

> **Purpose:** Define measurable, objective criteria for declaring the launch successful.
> These metrics are monitored continuously for the **first 30 days** post-launch.

---

## Launch Success Declaration

The launch is declared **SUCCESSFUL** when all Tier 1 metrics are met for **72 consecutive hours** post-launch.

---

## Tier 1 — Launch Gate Metrics (Non-Negotiable)

These must be met within **24 hours** of launch. Failure triggers escalation.

### Performance

| Metric | Target | Measurement Tool | Alert Threshold |
|--------|--------|-----------------|----------------|
| Page Load (LCP) — 95th percentile | **< 3 seconds** | Vercel Analytics / Lighthouse | > 4s = alert |
| API Response Time — 95th percentile | **< 500ms** | Vercel Function logs | > 1s = alert |
| Time to First Byte (TTFB) | **< 800ms** | Vercel Analytics | > 1.5s = alert |
| First Input Delay (FID) | **< 100ms** | Vercel Web Vitals | > 300ms = alert |
| Cumulative Layout Shift (CLS) | **< 0.1** | Vercel Web Vitals | > 0.25 = alert |

### Reliability

| Metric | Target | Measurement Tool | Alert Threshold |
|--------|--------|-----------------|----------------|
| Uptime | **≥ 99.9%** | UptimeRobot / BetterUptime | < 99.5% = P1 |
| Error Rate (5xx) | **< 0.5%** of all requests | Sentry / Vercel logs | > 1% = P1 alert |
| Failed auth attempts (non-malicious) | **< 2%** of login attempts | Sentry | > 5% = investigate |
| Database connection errors | **0** in steady state | Neon console / Sentry | Any = P1 alert |

### Security

| Metric | Target | Notes |
|--------|--------|-------|
| Critical security incidents | **0** in first week | Any CVE exploited = P1 |
| Rate limit violations blocked | Tracked in Upstash | Spike > 500/min = investigate |
| Unauthorised admin access attempts | **0** successful | Sentry + Vercel logs |

---

## Tier 2 — User Experience Metrics (First Week)

Tracked from Day 1. Review during daily standup.

### User Flows

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Registration flow completion time | **< 2 minutes** median | Measure from `/auth/signup` visit to dashboard redirect |
| Login flow completion time | **< 30 seconds** median | Measure from `/auth/signin` to dashboard load |
| Post creation time | **< 60 seconds** median | From clicking "Create Post" to post appearing in feed |
| Profile setup completion rate | **> 70%** of new users add avatar | UploadThing logs + DB query |
| Email verification rate | **> 60%** of registered users verify | DB: `emailVerified != null` |

### Engagement (First 7 Days)

| Metric | Target | Notes |
|--------|--------|-------|
| Day-1 retention | **> 40%** of registered users return | Return = new session next day |
| Posts per active user (first week) | **≥ 1 post** per user | Baseline for growth tracking |
| Neighbour connection requests sent | **≥ 50** total in first week | Signals social graph activation |

---

## Tier 3 — Business Metrics (First 30 Days)

Reviewed weekly. Used to assess product-market fit and growth health.

| Metric | Week 1 Target | Week 4 Target | Notes |
|--------|--------------|--------------|-------|
| Total registered users | 50+ | 200+ | Organic only at launch |
| Daily Active Users (DAU) | 20+ | 80+ | |
| Posts created | 100+ | 500+ | |
| Shops registered | 5+ | 25+ | Marketplace activation |
| User-reported bugs (P1/P2) | 0 | < 3 cumulative | Via GitHub Issues |
| Average Sentry errors/day | < 10 new issues | < 5 new issues | Decreasing trend |

---

## Monitoring Stack & Dashboards

| Tool | What It Monitors | Dashboard URL |
|------|-----------------|---------------|
| **Vercel Analytics** | Web Vitals, page performance, function times | vercel.com/dashboard → Analytics |
| **Sentry** | JavaScript errors, API exceptions, performance | sentry.io/organizations/inievo |
| **Neon Console** | DB query performance, connection counts | console.neon.tech |
| **UptimeRobot** | Uptime, response time from multiple regions | uptimerobot.com/dashboard |
| **Upstash Console** | Rate limit hits, Redis command counts | console.upstash.com |

### Key URLs to Monitor

```
https://www.thechattala.com           ← Home page
https://www.thechattala.com/dashboard ← Auth + dashboard load
https://www.thechattala.com/api/auth/session ← Session endpoint
```

---

## Metric Review Schedule

### Daily (First 2 Weeks)

- [ ] Check Sentry: new errors since yesterday
- [ ] Check Vercel: avg response time and error rate
- [ ] Check UptimeRobot: uptime percentage
- [ ] Check Neon: connection count and query durations
- [ ] Note any user-reported issues in GitHub Issues

### Weekly (First Month)

- [ ] Full Web Vitals report from Vercel Analytics
- [ ] User registration and retention trend
- [ ] Error rate trend (should be decreasing)
- [ ] Review all P3/P4 bug reports
- [ ] Update the `LAUNCH_READINESS_REPORT.md` with actual metrics

### Post-30 Days

- [ ] Full retrospective against all Tier 1, 2, 3 targets
- [ ] Update success metrics targets for v1.1.0 based on learnings
- [ ] Publish internal launch debrief document

---

## Escalation Thresholds

| Trigger | Severity | Who to Notify | Action |
|---------|----------|--------------|--------|
| Error rate > 1% for 5 consecutive minutes | **P1** | Engineering Lead immediately | Investigate + potential rollback |
| Site down > 2 minutes | **P1** | Engineering Lead + post status update | Immediate rollback if no ETA |
| LCP > 5s for 10+ minutes | **P2** | Engineering Lead | Investigate Vercel / CDN issue |
| Database errors appear in Sentry | **P1** | Engineering Lead | Check Neon console, connection pool |
| Any successful unauthorised admin access | **P1** | Engineering Lead + security review | Disable route, audit logs |
| User reports data loss | **P1** | Engineering Lead + CEO | Stop writes, investigate, communicate |

---

*Success Metrics version: 1.0.0*
*Next review: 30 days post-launch or after any major incident.*
