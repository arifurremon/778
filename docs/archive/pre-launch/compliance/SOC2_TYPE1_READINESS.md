# SOC 2 Type I Readiness Checklist

> **Phase 9.2** — Manual mapping to Trust Services Criteria (TSC).  
> Not a certification — readiness assessment for enterprise sales conversations.

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Implemented + evidenced |
| 🟡 | Partial / manual process |
| ❌ | Gap — roadmap or deferred |
| N/A | Not applicable at current scale |

---

## CC — Security

| Control | Status | Evidence |
|---------|--------|----------|
| CC1.1 Security policy communicated | 🟡 | `SECURITY.md`, privacy/terms pages |
| CC2.1 Logical access (RBAC) | ✅ | `docs/RBAC_MATRIX.md`, Role enum, admin guards |
| CC2.2 MFA for privileged users | ✅ | TOTP for admin (`ADMIN_MFA_REQUIRED`) |
| CC3.1 Change management | ✅ | PR + CI + branch protection docs |
| CC3.2 Secure SDLC | ✅ | ESLint, tests, CodeQL, Dependabot |
| CC5.1 Vulnerability management | 🟡 | ZAP workflow, npm audit, pentest template |
| CC6.1 Encryption in transit | ✅ | HTTPS/TLS (Vercel), Neon SSL |
| CC6.6 Encryption at rest | 🟡 | Neon encryption (provider); app-level field encryption N/A |
| CC7.1 Intrusion detection | 🟡 | Sentry alerts, rate limits |
| CC7.2 Security monitoring | ✅ | Sentry, `/api/health`, runbooks |
| CC8.1 Incident response | ✅ | `docs/INCIDENT_RESPONSE.md`, on-call rotation |

---

## A — Availability

| Control | Status | Evidence |
|---------|--------|----------|
| A1.1 Capacity planning | ✅ | `docs/CAPACITY_PLANNING.md` |
| A1.2 Backup & recovery | 🟡 | Neon PITR (deferred drill), backup-verify workflow |
| A1.3 Incident handling | ✅ | Runbooks, status page route |

---

## C — Confidentiality

| Control | Status | Evidence |
|---------|--------|----------|
| C1.1 Data classification | 🟡 | PII in User model; legal docs |
| C1.2 Data retention | ✅ | Retention cron, `docs/legal/DPA_TEMPLATE.md` |
| C1.3 Data export/delete | ✅ | GDPR export + delete account flows |

---

## PI — Processing Integrity

| Control | Status | Evidence |
|---------|--------|----------|
| PI1.1 Input validation | ✅ | Zod on API routes |
| PI1.2 Idempotency (orders) | ✅ | Phase 6 Idempotency-Key |

---

## P — Privacy

| Control | Status | Evidence |
|---------|--------|----------|
| P1.1 Privacy notice | ✅ | `/privacy`, consent ledger |
| P2.1 Consent | ✅ | Cookie banner, `ConsentRecord` |
| P3.1 Data subject rights | ✅ | Export, delete, policy re-consent |

---

## Gaps to close before SOC 2 audit

1. Complete Neon PITR drill + document RTO/RPO (`DEFERRED_POST_COMPLETION_TASKS.md`)
2. Fill pentest report with zero High/Critical
3. Formal vendor risk reviews (Neon, Vercel, Upstash, Inngest)
4. Employee security training records (organizational)

---

## Readiness score (internal)

| TSC category | Score / 5 |
|--------------|-----------|
| Security | 4.2 |
| Availability | 3.8 |
| Confidentiality | 4.0 |
| Processing Integrity | 4.5 |
| Privacy | 4.3 |
| **Overall readiness** | **4.2 / 5** — Type I prep, not certified |

---

**Last updated:** Phase 9 implementation
