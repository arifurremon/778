# On-Call Rotation — The Chattala

> **Phase 8.4** — Minimum two people can operate production without the original developer.

---

## Rotation schedule

| Week | Primary on-call | Secondary (backup) | Timezone |
|------|-----------------|--------------------|----------|
| W1 | _Name / @handle_ | _Name / @handle_ | Asia/Dhaka (UTC+6) |
| W2 | _Name / @handle_ | _Name / @handle_ | Asia/Dhaka |
| W3 | _Name / @handle_ | _Name / @handle_ | Asia/Dhaka |
| W4 | _Name / @handle_ | _Name / @handle_ | Asia/Dhaka |

**Handoff:** Every Monday 10:00 BDT — review open incidents, Sentry noise, pending deploys.

> Fill names before launch. Until then, default primary: **Abu Md. Selim** — add secondary before GO.

---

## Escalation matrix

| Severity | Example | Response target | Primary action | Escalate to |
|----------|---------|-----------------|----------------|-------------|
| **P1** | Site down, DB unreachable, auth broken | **15 min** ack | Run [NEON_DOWN](./runbooks/NEON_DOWN.md) or hosting rollback | Engineering Lead + CEO |
| **P2** | Redis down, email failing, Pusher down | **30 min** ack | Matching runbook; enable status page | Engineering Lead |
| **P3** | Elevated errors, slow p95, single feature broken | **4 hours** ack | Triage in Sentry; schedule fix | Primary resolves |
| **P4** | Cosmetic, non-user-facing | Next business day | Backlog ticket | — |

---

## Alert routing

| Source | Channel | On-call action |
|--------|---------|----------------|
| Sentry (error rate, health) | Email + Slack `#incidents` | Ack + assign owner |
| Better Stack / UptimeRobot | SMS optional | Verify `/api/health` |
| GitHub Actions (promote fail) | Email to repo admins | Block prod until fixed |

See [SENTRY_ALERTS.md](./observability/SENTRY_ALERTS.md) for rule definitions.

---

## Contact tree

```
User report / monitor alert
        ↓
  Primary on-call (15 min)
        ↓ (no ack or P1)
  Secondary on-call
        ↓ (30 min unresolved P1)
  Engineering Lead — Abu Md. Selim
        ↓ (business impact > 2h)
  Executive — Inievo Technologies
```

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | Abu Md. Selim | _email / phone — fill before launch_ |
| Secondary engineer | _TBD_ | _fill before launch_ |
| Executive escalation | Inievo Technologies | _fill before launch_ |

---

## Runbook index

| Dependency | Runbook |
|------------|---------|
| Redis / cache / rate limits | [REDIS_DOWN.md](./runbooks/REDIS_DOWN.md) |
| Neon PostgreSQL | [NEON_DOWN.md](./runbooks/NEON_DOWN.md) |
| Pusher realtime | [PUSHER_DOWN.md](./runbooks/PUSHER_DOWN.md) |
| SMTP email | [SMTP_DOWN.md](./runbooks/SMTP_DOWN.md) |
| DR / restore | [DR_DRILL_GUIDE_BN.md](./runbooks/DR_DRILL_GUIDE_BN.md) |

---

## On-call responsibilities

1. Monitor `#incidents` and Sentry during shift.
2. Acknowledge alerts within SLA for assigned severity.
3. Use [Incident Response](./INCIDENT_RESPONSE.md) template for P1/P2.
4. Update public [status page](/status) if impact > 5 minutes.
5. Hand off open incidents with timeline notes.

---

## Training requirement (exit criteria)

Two team members must independently:

- [ ] Restore previous Vercel deployment (rollback drill)
- [ ] Run `scripts/staging-smoke.sh` and interpret failures
- [ ] Execute Redis + Neon runbooks in staging
- [ ] File post-mortem using incident template

Sign-off table in `LAUNCH_READINESS_REPORT.md`.
