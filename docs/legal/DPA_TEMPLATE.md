# Data Processing Agreement (DPA) Template

**Version:** 1.0.0  
**Last updated:** 2026-03-12  
**Status:** Template for B2B merchant / partner onboarding — legal review required before execution.

---

## 1. Parties

| Role | Entity | Contact |
|------|--------|---------|
| **Data Controller** | `[Merchant Legal Name]` | `[Merchant DPO / legal contact]` |
| **Data Processor** | Inievo Technologies ("The Chattala") | privacy@thechattala.com |

This DPA supplements the Master Services Agreement ("MSA") between the parties and governs processing of personal data when the Merchant uses The Chattala marketplace, directory, or API integrations.

---

## 2. Definitions

- **Personal Data** — any information relating to an identified or identifiable natural person processed via The Chattala platform.
- **Processing** — collection, storage, display, transmission, deletion, or other operation on Personal Data.
- **Sub-processor** — a third party engaged by The Chattala to process Personal Data (e.g. Neon Postgres, Vercel, Resend, Upstash Redis, Pusher, Sentry).

---

## 3. Scope & Purpose

The Processor processes Personal Data solely to:

1. Host and operate the Merchant's shop listing, products, orders, and customer communications;
2. Provide authentication, notifications, analytics (consent-gated), and fraud prevention;
3. Comply with applicable law and documented instructions from the Controller.

**Categories of data subjects:** Merchant staff, customers, service clients, community members.  
**Categories of data:** names, contact details, order history, messages, IP addresses, consent records.

---

## 4. Controller Instructions

The Processor shall process Personal Data only on documented instructions from the Controller, including via:

- Merchant admin dashboard settings;
- API calls authenticated with Merchant credentials;
- This DPA and the MSA.

The Processor shall inform the Controller if an instruction appears to violate Bangladesh data protection principles or applicable GDPR obligations for cross-border users.

---

## 5. Security Measures

The Processor maintains administrative, technical, and organizational measures including:

| Control | Implementation |
|---------|----------------|
| Encryption in transit | TLS 1.2+ on all endpoints |
| Access control | Role-based access (RBAC), MFA for admin mutations |
| Audit logging | Auth and admin actions logged with IP / user-agent |
| Rate limiting | Mutation endpoints rate-limited per IP / user |
| Vulnerability management | Dependabot, CI lint/build/test gates |
| Incident response | Documented in `SECURITY.md`; notify Controller within 72 hours of confirmed breach affecting Merchant data |

---

## 6. Sub-processors

Current sub-processors (notify Merchant of material changes 30 days in advance):

| Sub-processor | Purpose | Location |
|---------------|---------|----------|
| Neon | PostgreSQL database | US/EU (region-specific) |
| Vercel | Application hosting | Global edge |
| Upstash | Redis / rate limiting | Configurable region |
| Resend | Transactional email | US |
| Pusher | Real-time messaging | US/EU |
| Sentry | Error monitoring | US/EU |
| Google Analytics | Usage analytics (consent-gated) | US |

Merchant may object to a new sub-processor on reasonable grounds within 14 days of notice.

---

## 7. Data Subject Rights

The Processor assists the Controller in fulfilling data subject requests (access, rectification, erasure, portability, restriction) via:

- `GET /api/user/export` — JSON data portability export;
- Account deletion flow — anonymization with legal-minimum retention;
- Consent ledger — `ConsentRecord` audit trail.

Merchant-facing customer requests should be routed through `[Merchant support email]` with Processor escalation to privacy@thechattala.com.

---

## 8. Retention & Deletion

| Data type | Retention |
|-----------|-----------|
| Activity logs | 12 months, then purged |
| Audit logs | 24 months, then purged |
| Soft-deleted accounts | Anonymized immediately; hard purge after 30 days |
| Order / transaction records | Retained as legally required for tax and dispute resolution |

Automated retention jobs run via `/api/cron/data-retention` (Bearer `CRON_SECRET`).

---

## 9. International Transfers

Where Personal Data is transferred outside Bangladesh, the Processor relies on:

- Standard contractual clauses or equivalent safeguards with sub-processors;
- Encryption and access controls as supplementary measures.

---

## 10. Audits

Upon reasonable notice, the Controller may request:

1. SOC 2 / ISO reports from sub-processors (where available); or
2. A completed security questionnaire based on `SECURITY.md` and `docs/ARCHITECTURE.md`.

On-site audits limited to once per year unless required by regulator.

---

## 11. Liability & Term

This DPA remains in effect for the duration of the MSA. Upon termination, the Processor shall delete or return Personal Data within 30 days unless retention is required by law.

---

## 12. Signatures

**Controller — `[Merchant Legal Name]`**

Name: ___________________________  
Title: ___________________________  
Date: ___________________________

**Processor — Inievo Technologies (The Chattala)**

Name: ___________________________  
Title: ___________________________  
Date: ___________________________

---

> **Note:** This is a template only. Engage qualified legal counsel before signing. Customize bracketed fields and jurisdiction clauses for each merchant agreement.
