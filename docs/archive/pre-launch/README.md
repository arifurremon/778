# Pre-Launch Enterprise Templates (Archived)

> **Status:** Archived — **not active runbooks** until the platform has 100+ active users.  
> **Why:** These documents create a “production-ready” appearance before operational maturity. Keep them as **templates**, not day-to-day process.

## Contents

| Document | Original purpose |
|----------|------------------|
| [SOC2_TYPE1_READINESS.md](./compliance/SOC2_TYPE1_READINESS.md) | SOC 2 Type I readiness checklist |
| [ENTERPRISE_SCORECARD.md](./ENTERPRISE_SCORECARD.md) | Internal GO/NO-GO scorecard |
| [ON_CALL_ROTATION.md](./ON_CALL_ROTATION.md) | On-call rotation guide |
| [CAPACITY_PLANNING.md](./CAPACITY_PLANNING.md) | Capacity planning |
| [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) | Incident response playbook |
| [DR_DRILL_GUIDE_BN.md](./runbooks/DR_DRILL_GUIDE_BN.md) | DR drill guide (Bengali) |

## Active docs (use these instead)

- Launch: [`docs/launch/README.md`](../../launch/README.md)
- Deploy env: [`docs/DEPLOYMENT_ENV.md`](../../DEPLOYMENT_ENV.md)
- Security: [`SECURITY.md`](../../../SECURITY.md) (repo root)
- Operational runbooks (live incidents): [`docs/runbooks/`](../runbooks/) — Pusher, Neon, Redis, SMTP

## When to un-archive

1. Production validated (smoke + staging + DR smoke)
2. 100+ weekly active users OR paid enterprise customers
3. Named on-call rotation in place

Until then: **ship features, collect feedback, keep docs lean.**
