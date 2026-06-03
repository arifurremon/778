# Security Policy

> **Project:** The Chattala — Hyperlocal City Platform  
> **Maintainer:** Inievo Technologies — Abu Md. Selim, Engineering Lead  
> **Last updated:** 2026-03-12

---

## Supported Versions

| Version | Supported | Notes |
|---------|-----------|-------|
| 1.0.x | ✅ | Current production line |
| 0.x | ❌ | Pre-release; no security patches |

Security fixes are backported to the **latest 1.0.x** release only.

---

## Reporting a Vulnerability

**Do not** open public GitHub issues for security vulnerabilities.

| Channel | Contact |
|---------|---------|
| **Primary** | security@inievo.com |
| **Backup** | Abu Md. Selim — via private channel provided to partners |

Include:
1. Description of the vulnerability and impact
2. Steps to reproduce (PoC if available)
3. Affected URL/route or component
4. Your contact for follow-up

### Response SLA

| Severity | Acknowledgement | Target fix |
|----------|-----------------|------------|
| Critical (RCE, auth bypass, data breach) | 24 hours | 7 days |
| High (privilege escalation, XSS on admin) | 48 hours | 14 days |
| Medium (CSRF, rate-limit bypass) | 5 business days | 30 days |
| Low (info disclosure, missing headers) | 10 business days | Next release |

We will confirm receipt, provide a tracking ID, and notify you when the issue is resolved. Responsible disclosure is appreciated; we do not pursue legal action against good-faith researchers.

---

## Security Architecture (Summary)

- **Authentication:** NextAuth v5 credentials + JWT; optional Google OAuth when `GOOGLE_*` env vars are set; live DB checks on privileged routes
- **Authorization:** Role-based (`Role` enum) with DB-backed admin verification
- **Admin MFA:** TOTP required in production (`ADMIN_MFA_REQUIRED`)
- **Rate limiting:** Upstash Redis, fail-closed in production
- **CSP:** Nonce-based Content-Security-Policy via middleware
- **Audit:** Admin and auth events persisted to `AuditLog`

See `docs/ARCHITECTURE.md` and `docs/RBAC_MATRIX.md` for details.

### Content-Security-Policy notes

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `script-src` | `'nonce-…'` + `'strict-dynamic'` (prod) | Blocks inline script injection; third-party hosts allowlisted |
| `style-src` | `'self' 'unsafe-inline'` | **Accepted risk:** Tailwind CSS and React/Next.js inject inline styles at runtime. Removing `'unsafe-inline'` requires a strict style-nonce build pipeline (not yet adopted). |
| `frame-src` | `'self' https://accounts.google.com` | Google OAuth consent / One Tap flows |
| `frame-ancestors` | `'none'` | Clickjacking protection (complements `X-Frame-Options: DENY`) |

Google OAuth guardrails (server-side):

- Suspended or deleted accounts are blocked at the `signIn` callback
- MFA-enabled admin accounts must use credentials + TOTP (Google sign-in denied)
- Successful Google sign-ins set `emailVerified` and are audit-logged

---

## Hardening Checklist (Internal)

Before each release, Engineering Lead verifies:

- [ ] All mutation API routes use session guards + rate limits
- [ ] No `@ts-ignore` in `src/app/api/admin/**`
- [ ] `npm run validate` and CI build pass
- [ ] Dependabot PRs reviewed for high/critical CVEs
- [ ] Admin accounts have MFA enabled in production

---

*© 2026 Inievo Technologies*
