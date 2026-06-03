# The Chattala — Baseline Audit (Phase 0)

> **Audit date:** 2026-03-12  
> **Branch:** `main` (post PR #53/#54)  
> **Auditor:** Engineering Lead — Inievo Technologies  
> **Purpose:** Establish measurable baseline before Enterprise Roadmap Phases 1–9.

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Enterprise readiness score** | **2.5 / 5.0** (50 / 100) |
| **Launch readiness score** | **50 / 100** — **NO-GO** |
| **Confidence level** | **6 / 10** |
| **Recommendation** | **DELAY 8–12 weeks** (complete Phases 1–4 minimum) |

The Chattala is a **feature-rich, launch-capable SMB SaaS** with strong auth patterns and a growing test suite. It is **not yet enterprise-grade**. Critical gaps: ESLint/build not enforced in CI, partial session-guard coverage, no compliance pages, no `/api/health`, DR drills untested, RBAC is boolean-flag based.

---

## Automated Audit Results (2026-03-12)

| Command | Result | Notes |
|---------|--------|-------|
| `npm run validate` | ✅ PASS | 41 test files, 166 tests, 0 TypeScript errors |
| `npm run build` | ✅ PASS | `prisma migrate deploy && next build` succeeds |
| `npx prisma migrate status` | ✅ PASS | 16 migrations, schema up to date |
| `npm run test:coverage` | ⚠️ N/A | `@vitest/coverage-v8` not installed (Phase 1 task) |
| `npm run lint` | ⚠️ NOT IN CI | Runs locally; not enforced on PR merge |
| `npm run test:e2e` | ✅ CI GREEN | 6 Playwright spec files; E2E workflow passes on `main` |
| Fresh Postgres migrate deploy | ✅ CI GREEN | E2E workflow runs `prisma migrate deploy` on empty Postgres |

---

## Codebase Inventory

| Asset | Count |
|-------|-------|
| API route handlers | 90 (`src/app/api/**/route.ts`) |
| Vitest test files | 41 |
| Vitest tests | 166 |
| Playwright E2E specs | 6 |
| Prisma migrations | 16 |
| GitHub Actions workflows | 3 (CI, E2E, CodeQL) |

---

## Security Posture Snapshot

| Control | Status | Evidence |
|---------|--------|----------|
| Password hashing (bcrypt) | ✅ | `src/app/api/auth/register/route.ts` |
| Session guards (`requireActiveSession`) | ⚠️ Partial | ~65 routes use guards; ~14 still call `auth()` directly |
| Admin guards (`requireAdmin`) | ✅ | Live DB lookup; JWT `isAdmin` not trusted |
| CSRF on mutations | ⚠️ Partial | `requireActiveMutation` used on many routes; not universal |
| Rate limiting (Upstash) | ⚠️ Partial | ~20 routes wired; ~70 mutation routes unaudited |
| CSP | ⚠️ Partial | Headers set; `unsafe-inline` in production (TODO: nonce) |
| MFA for admins | ❌ | Not implemented |
| RBAC enum / permissions table | ❌ | Boolean flags only (`isAdmin`, `isSeller`, `isServiceProvider`) |
| Audit log persistence | ⚠️ Partial | `AuditLog` model exists; not all admin actions logged |
| Privacy / Terms pages | ❌ | Not present |
| GDPR data export | ❌ | Not present |

---

## CI/CD Snapshot

| Check | Enforced on PR? |
|-------|-----------------|
| Typecheck | ✅ |
| Unit + integration tests | ✅ |
| Playwright E2E | ✅ |
| CodeQL | ✅ |
| ESLint | ❌ |
| Production build | ❌ |
| Coverage threshold | ❌ |
| `npm audit` | ❌ |
| Dependabot | ❌ |

---

## Category Scores (Launch Readiness Framework)

| Category | Weight | Raw Score | Weighted |
|----------|--------|-----------|----------|
| Build & Code Quality | 15% | 9 / 15 | 9.0 |
| Security (Auth, Input, Headers) | 30% | 14 / 30 | 14.0 |
| Testing & Coverage | 15% | 8 / 15 | 8.0 |
| Performance | 15% | 6 / 15 | 6.0 |
| Infrastructure & Monitoring | 15% | 6 / 15 | 6.0 |
| User Experience | 10% | 7 / 10 | 7.0 |
| **Total** | **100%** | | **50 / 100** |

---

## Critical Blockers (Launch)

| # | Blocker | Severity | Target Phase |
|---|---------|----------|--------------|
| 1 | ESLint + build not in CI | Critical | Phase 1 |
| 2 | No privacy / terms pages | Critical | Phase 3 |
| 3 | Rollback + DR drills untested | High | Phase 4 |
| 4 | Session guards not on 100% of routes | High | Phase 2 |
| 5 | No public `/api/health` endpoint | High | Phase 4 |
| 6 | Vercel production deploy blocked (account) | High | External (alternate host) |

---

## Enterprise Dimension Scores (5-point scale)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Engineering discipline | 2.5 | Tests exist; lint/build/coverage not gated |
| Security | 3.0 | Good auth foundation; guards + RBAC incomplete |
| Compliance | 1.5 | No GDPR-minimum artifacts |
| Observability | 2.0 | Sentry present; no health/metrics/SLOs |
| Reliability | 2.0 | Neon backups assumed; DR untested |
| API platform | 1.5 | No OpenAPI, webhooks, or idempotency |
| Scalability | 2.0 | Serverless; no job queue |
| Data platform | 2.5 | Migrations fixed; analytics partly hardcoded |

**Average: 2.1 / 5.0** → rounded **2.5 / 5.0** with feature-breadth credit.

---

## Phase 0 Exit Criteria Checklist

- [x] Baseline CI green on `main` (validate + E2E + CodeQL)
- [x] `docs/ARCHITECTURE.md` created (C4 Context + Container)
- [x] `docs/RBAC_MATRIX.md` v0.1 draft
- [x] `docs/BRANCH_STRATEGY.md` defined
- [x] `docs/GITHUB_PROJECT_SETUP.md` guide created
- [x] `LAUNCH_READINESS_REPORT.md` placeholders filled
- [ ] Team sign-off on architecture + RBAC (pending review)

---

## Next Actions (Phase 1 Preview)

1. Add `eslint.config.js` + `npm run lint` to CI
2. Add `npm run build` to CI with Postgres service
3. Install `@vitest/coverage-v8`; set API route threshold ≥ 70%
4. Enable Dependabot + Husky pre-commit hooks

---

*This document is the canonical baseline. Re-run the audit after each major phase milestone.*
