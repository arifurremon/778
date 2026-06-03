# Incident Response Template

> **Phase 8.5** — Severity, comms, post-mortem within 48h (P1/P2).

Copy this template for each production incident. Store completed reports in `docs/incidents/YYYY-MM-DD-short-title.md` (create folder when first incident occurs).

---

## Incident metadata

| Field | Value |
|-------|-------|
| **Incident ID** | INC-YYYY-MM-DD-001 |
| **Title** | _One-line summary_ |
| **Severity** | P1 / P2 / P3 / P4 |
| **Status** | Investigating / Mitigating / Resolved / Post-mortem |
| **Started (UTC)** | |
| **Detected by** | Monitor / User report / Internal |
| **Incident commander** | |
| **Scribe** | |
| **Customer impact** | _None / Partial / Full outage_ |

---

## Timeline (UTC)

| Time | Event |
|------|-------|
| HH:MM | Alert fired / report received |
| HH:MM | Acknowledged by on-call |
| HH:MM | Mitigation applied |
| HH:MM | Service restored |
| HH:MM | All-clear communicated |

---

## Severity definitions

| Level | Criteria | Comms |
|-------|----------|-------|
| **P1** | Complete outage or data breach suspicion | Status page + stakeholder email within 30 min |
| **P2** | Major feature broken (auth, orders, payments path) | Status page if > 5 min user impact |
| **P3** | Degraded performance or minor feature | Internal only unless prolonged |
| **P4** | Low impact | Ticket only |

---

## Communication checklist

- [ ] `#incidents` Slack thread opened
- [ ] Status page updated (if user-facing > 5 min)
- [ ] Engineering Lead notified (P1/P2)
- [ ] Resolution posted to status page
- [ ] Support macro sent if tickets open

**Status page URL:** `/status` (link Better Stack / Instatus when configured)

---

## Technical summary

### Symptoms

_What users/monitors saw_

### Root cause

_5 Whys or equivalent — fill after resolution_

### Mitigation

_What fixed it (rollback, config, scale, etc.)_

### Runbooks used

- [ ] REDIS_DOWN  [ ] NEON_DOWN  [ ] PUSHER_DOWN  [ ] SMTP_DOWN  [ ] Other: ___

---

## Post-mortem (required P1/P2 within 48h)

### What went well

-

### What went poorly

-

### Action items

| Action | Owner | Due date | Status |
|--------|-------|----------|--------|
| | | | |

### Lessons learned

-

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Incident commander | | |
| Engineering Lead | | |

---

## Quick commands

```bash
# Health check
curl -s https://www.thechattala.com/api/v1/health | jq .

# Staging smoke (compare)
STAGING_URL=https://staging.example.com bash scripts/staging-smoke.sh

# Rollback — Vercel dashboard → Deployments → Promote previous
```

See [Promotion Workflow](./PROMOTION_WORKFLOW.md) and [On-Call Rotation](./ON_CALL_ROTATION.md).
