# The Chattala — Enterprise Grade Roadmap (Target: 5/5)

> **Purpose:** Transform The Chattala from launch-ready SMB SaaS (~2.5/5) to enterprise-grade SaaS (5/5).
> **Scope:** All improvements except Vercel account (deploy on alternate account/host).
> **Execution model:** Phase-by-phase; do not start Phase N+1 until Phase N exit criteria pass.

---

## Score Targets by Milestone

| Milestone | Phases | Target Score | Audience |
|-----------|--------|--------------|----------|
| M0 Baseline | Phase 0 | 2.5 → 2.6 | Internal alignment |
| M1 Production Hardened | Phase 1–2 | 3.5/5 | Public launch, pilot users |
| M2 Enterprise-Ready Core | Phase 3–5 | 4.0/5 | B2B partners, municipalities |
| M3 Enterprise Platform | Phase 6–7 | 4.5/5 | Integrations, scale |
| M4 Enterprise Grade | Phase 8–9 | 5.0/5 | SOC2-adjacent, large org sales |

---

## Phase 0 — Baseline & Governance (Week 1)

**Goal:** Freeze scope, measure current state, define "done" for every future phase.

### Tasks
- [x] **0.1** Run full baseline audit: `npm run validate`, `npm run test:e2e`, `npm run build`, `npx prisma migrate deploy` on empty Postgres.
- [x] **0.2** Fill `LAUNCH_READINESS_REPORT.md` placeholders (backup test date, rollback test date, on-call contact).
- [x] **0.3** Create `docs/ARCHITECTURE.md` — C4 Context + Container diagrams (auth, Neon, Redis, Pusher, UploadThing).
- [x] **0.4** Define RBAC matrix draft (roles: `user`, `seller`, `expert`, `moderator`, `admin`, `superadmin`).
- [x] **0.5** Create GitHub Project board: columns = Phase 1–9, labels = P0/P1/P2.
- [x] **0.6** Branch strategy: `main` (prod), `staging`, feature branches → PR required.

### Exit Criteria
- [x] Baseline CI green on `main`.
- [x] Architecture doc approved by team. *(draft complete — formal sign-off pending)*
- [x] RBAC matrix v0.1 signed off. *(draft complete — formal sign-off pending)*

### Score impact: +0.1

---

## Phase 1 — CI/CD & Engineering Discipline (Weeks 2–3)

**Goal:** No regressions ship; lint/build/coverage enforced.

### Tasks
- [ ] **1.1** Add ESLint config (`eslint.config.js`) — extend `next/core-web-vitals` + TypeScript rules.
- [ ] **1.2** Add `npm run lint` to `.github/workflows/ci.yml` (fail on error).
- [ ] **1.3** Add `npm run build` to CI (catches Next.js build + migrate deploy issues).
- [ ] **1.4** Add coverage threshold in `vitest.config.ts`: API routes `src/app/api/**` ≥ 70%.
- [ ] **1.5** Require E2E workflow pass before merge (branch protection rules).
- [ ] **1.6** Add `npm audit --audit-level=high` to CI (fail or warn with ticket).
- [ ] **1.7** Enable Dependabot (`.github/dependabot.yml`) for npm + GitHub Actions.
- [ ] **1.8** Husky + lint-staged: typecheck + lint on pre-commit.
- [ ] **1.9** Consolidate duplicate docs (keep canonical copies under `docs/`, remove root duplicates).

### Exit Criteria
- PR cannot merge with lint/typecheck/test/build/coverage failures.
- Dependabot PRs reviewed weekly.

### Score impact: Engineering discipline 2.5 → 4.0

---

## Phase 2 — Security Hardening (Weeks 4–6)

**Goal:** Consistent auth guards, RBAC foundation, security questionnaire pass.

### Tasks
- [ ] **2.1** Audit all API routes — migrate remaining `auth()` calls to `requireActiveSession` / `requireActiveMutation`.
  - Priority files: `bookings/route.ts`, `messages/**`, `user/saved-posts/route.ts`, any route missing guard.
- [ ] **2.2** Extend rate limits to all mutation routes (~90 routes audit against `src/lib/rate-limit.ts`).
- [ ] **2.3** Align `API.md` rate limit docs with actual `rateLimiters` config.
- [ ] **2.4** Remove all `SCHEMA-FALLBACK` / `@ts-ignore` blocks in admin routes — use typed Prisma fields.
- [ ] **2.5** Implement nonce-based CSP via middleware (`next.config.ts` TODO).
- [ ] **2.6** Replace root `SECURITY.md` with real vuln disclosure process + supported versions.
- [ ] **2.7** Add `Role` enum + `permissions` JSON or join table; migrate `isAdmin` → role-based checks.
- [ ] **2.8** MFA for admin accounts (TOTP via `@auth/core` or dedicated library).
- [ ] **2.9** Persist audit events: login, logout, failed login, password reset, admin actions → `AuditLog`.
- [ ] **2.10** Delete dead code: `/employee`, unused Genkit scripts/deps (or implement properly).

### Exit Criteria
- Zero `@ts-ignore` in `src/app/api/admin/**`.
- 100% mutation routes have session guard + rate limit.
- MFA enforced for all admin users.
- Security self-assessment checklist in `PRODUCTION_CHECKLIST.md` 100% checked.

### Score impact: Security 3.0 → 4.5

---

## Phase 3 — Compliance & Privacy (Weeks 7–9)

**Goal:** GDPR-minimum + Bangladesh data protection alignment.

### Tasks
- [ ] **3.1** Create `/privacy` and `/terms` pages (versioned content, last updated date).
- [ ] **3.2** Store policy acceptance: `User.policyAcceptedAt`, `User.policyVersion` on register + re-consent flow.
- [ ] **3.3** Cookie consent banner (essential vs analytics); gate GA4 behind consent.
- [ ] **3.4** `GET /api/user/export` — JSON export of all user data (GDPR portability).
- [ ] **3.5** Harden `DELETE /api/user/delete-account` — cascade anonymize PII, retain legal minimum.
- [ ] **3.6** Data retention cron jobs:
  - ActivityLog > 12 months → archive/delete
  - AuditLog > 24 months → archive
  - Soft-deleted users > 30 days → hard purge
- [ ] **3.7** Consent ledger table: `ConsentRecord(userId, type, granted, ip, timestamp)`.
- [ ] **3.8** DPA template doc for B2B merchants (`docs/legal/DPA_TEMPLATE.md`).

### Exit Criteria
- Privacy policy live + linked from footer/register.
- Data export + delete tested in E2E.
- Retention jobs run in staging without data loss bugs.

### Score impact: Compliance 1.5 → 4.0

---

## Phase 4 — Reliability & Observability (Weeks 10–12)

**Goal:** Operable at 3am; measurable SLOs.

### Tasks
- [ ] **4.1** Public `GET /api/health` — DB ping, Redis ping, no auth required (for uptime monitors).
- [ ] **4.2** Structured logging: `pino` or `@vercel/otel` — JSON logs with `requestId`, `userId`, `route`.
- [ ] **4.3** OpenTelemetry metrics: request latency histogram, error rate counter, DB query duration.
- [ ] **4.4** Sentry: environment-based sampling; custom spans on order/booking/admin flows.
- [ ] **4.5** Alert rules (Sentry or Grafana): error rate > 1%, p95 latency > 2s, health check fail.
- [ ] **4.6** Public status page (Better Stack / Instatus) linked from footer.
- [ ] **4.7** Execute DR drill: Neon PITR restore → staging; document in `LAUNCH_READINESS_REPORT.md`.
- [ ] **4.8** Execute Vercel/hosting rollback drill; record RTO/RPO numbers.
- [ ] **4.9** On-call runbook: Redis down, Neon down, Pusher down, SMTP down — step-by-step in `docs/runbooks/`.

### Exit Criteria
- `/api/health` monitored externally (UptimeRobot/Better Stack).
- DR drill completed once with recorded RTO < 4 hours.
- At least 3 alert rules firing correctly in staging test.

### Score impact: Observability 2.0 → 4.0, Reliability 2.0 → 4.0

---

## Phase 5 — Data Platform (Weeks 13–14)

**Goal:** Migration integrity, real analytics, retention automation.

### Tasks
- [ ] **5.1** CI validate job: run `prisma migrate deploy` on empty Postgres (same as E2E).
- [ ] **5.2** Remove or quarantine risky migration `clean_old_users` if not needed in fresh installs.
- [ ] **5.3** Admin analytics: replace hardcoded trend badges with real SQL aggregations.
- [ ] **5.4** Add DB indexes audit — verify all hot queries covered (use `EXPLAIN ANALYZE` in staging).
- [ ] **5.5** Staging database seed script: `npm run seed:staging` (users, shops, posts, directory).
- [ ] **5.6** Backup verification job (weekly GitHub Action): restore Neon branch → run smoke query.

### Exit Criteria
- Fresh `migrate deploy` passes in both CI validate and E2E.
- Admin dashboard shows real metrics, not placeholders.
- Weekly backup verification Action green.

### Score impact: Data 2.5 → 4.0

---

## Phase 6 — API Platform (Weeks 15–17)

**Goal:** B2B integrators can build on The Chattala API.

### Tasks
- [ ] **6.1** Generate OpenAPI 3.1 spec from Zod schemas (`zod-to-openapi` or `@asteasolutions/zod-to-openapi`).
- [ ] **6.2** Expose `/api/openapi.json` + `/api/docs` (Swagger UI or Scalar).
- [ ] **6.3** API versioning: prefix new routes `/api/v1/*`; document deprecation policy.
- [ ] **6.4** Idempotency-Key header on: `POST /api/orders`, bookings, shop/service registration.
- [ ] **6.5** Rate limit response headers: `X-RateLimit-Limit`, `Remaining`, `Reset`.
- [ ] **6.6** Outbound webhooks model: `WebhookSubscription(userId, url, events[], secret)`.
- [ ] **6.7** Webhook delivery: signed payloads (HMAC), retry with exponential backoff, DLQ table.
- [ ] **6.8** API keys for server-to-server: `ApiKey(userId, hashedKey, scopes[], expiresAt)`.
- [ ] **6.9** Sync `API.md` with OpenAPI spec (single source of truth = OpenAPI).

### Exit Criteria
- OpenAPI spec covers all public endpoints.
- Webhook test endpoint verified in staging.
- Idempotency tested: duplicate POST returns same resource, not duplicate.

### Score impact: API 2.0 → 4.5

---

## Phase 7 — Scalability & Async Architecture (Weeks 18–20)

**Goal:** Heavy work off the request path; proven under load.

### Tasks
- [ ] **7.1** Background job queue: Inngest or BullMQ + Redis for:
  - Email sends
  - Bulk admin messaging
  - Notification fan-out (optional)
  - Data export generation
  - Retention purge jobs
- [ ] **7.2** Extend Redis caching to: directory, emergency, user profile (already partial), services list.
- [ ] **7.3** Load test with k6: 100 concurrent users, community feed + shop browse + booking flow.
- [ ] **7.4** Document capacity: max RPS, DB connection pool sizing, Redis memory budget.
- [ ] **7.5** Feature flags: `src/lib/feature-flags.ts` + env or LaunchDarkly for gradual rollouts.
- [ ] **7.6** Message queue for `@/lib/mail` — never block API response on SMTP.

### Exit Criteria
- k6 load test: p95 < 2s at 100 VUs, error rate < 0.1%.
- Email send never blocks HTTP response > 500ms due to SMTP.
- Queue dashboard or Inngest dev UI shows job success rate > 99%.

### Score impact: Scalability 2.5 → 4.5

---

## Phase 8 — Enterprise Operations (Weeks 21–22)

**Goal:** Team can operate without single-person dependency.

### Tasks
- [ ] **8.1** Staging environment: separate Neon branch + hosting project; auto-deploy on `staging` branch.
- [ ] **8.2** Promotion workflow: staging smoke → manual approve → production deploy.
- [ ] **8.3** IaC baseline: Terraform or Pulumi for Neon branch, Upstash Redis, DNS records.
- [ ] **8.4** On-call rotation doc (minimum 2 people); escalation matrix filled.
- [ ] **8.5** Incident response template: severity, comms, postmortem within 48h.
- [ ] **8.6** ADRs in `docs/adr/` — document JWT strategy, CSRF approach, notification dual-path, queue choice.
- [ ] **8.7** Remove `apphosting.yaml` or document why Firebase exists alongside primary host.

### Exit Criteria
- Staging deploy automated; production requires explicit promotion.
- Two people can run incident runbook without original developer.
- 5 ADRs written for key decisions.

### Score impact: Ops/Docs 3.0 → 4.5

---

## Phase 9 — Validation & Certification Prep (Weeks 23–26)

**Goal:** External proof; enterprise sales readiness.

### Tasks
- [ ] **9.1** Third-party pentest (or OWASP ZAP automated + manual review); fix all Critical/High.
- [ ] **9.2** SOC 2 Type I readiness checklist (Vanta/Drata or manual mapping).
- [ ] **9.3** Contract tests: Pact or OpenAPI response validation for top 10 endpoints.
- [ ] **9.4** Chaos test: Redis unavailable → app degrades gracefully (no 500 on read routes).
- [ ] **9.5** Full E2E suite expansion: admin moderation, booking lifecycle, data export/delete.
- [ ] **9.6** Performance budget: Lighthouse CI on `/`, `/dashboard`, `/shops` ≥ 90.
- [ ] **9.7** Accessibility audit: WCAG 2.1 AA on auth + settings + checkout flows.
- [ ] **9.8** Final enterprise scorecard review — target all pillars ≥ 4.5, weighted average ≥ 4.8.

### Exit Criteria
- Pentest report: zero Critical, zero High open issues.
- All 9 pillar scores ≥ 4.5 on internal scorecard.
- E2E suite ≥ 25 specs, all green on staging before prod promote.

### Score impact: Overall 4.5 → **5.0**

---

## Cross-Phase Rules (Always On)

1. **Every PR:** typecheck + lint + test + build pass.
2. **Every API route:** Zod validation + session guard + rate limit + Sentry error log.
3. **Every migration:** tested on empty Postgres before merge.
4. **Every phase end:** update this doc checkboxes + `LAUNCH_READINESS_REPORT.md`.
5. **No new features** during Phase 1–3 unless P0 production bug.
6. **Feature freeze** during Phase 9 validation month.

---

## Effort Summary

| Phase | Duration | Team (1 dev) | Team (2 devs) |
|-------|----------|--------------|---------------|
| 0 | 1 week | 1 week | 1 week |
| 1 | 2 weeks | 2 weeks | 1 week |
| 2 | 3 weeks | 3 weeks | 2 weeks |
| 3 | 3 weeks | 3 weeks | 2 weeks |
| 4 | 3 weeks | 3 weeks | 2 weeks |
| 5 | 2 weeks | 2 weeks | 1 week |
| 6 | 3 weeks | 3 weeks | 2 weeks |
| 7 | 3 weeks | 3 weeks | 2 weeks |
| 8 | 2 weeks | 2 weeks | 1 week |
| 9 | 4 weeks | 4 weeks | 3 weeks |
| **Total** | **~26 weeks** | **~6 months** | **~4 months** |

---

## Quick Start — What to Do Tomorrow

1. Create GitHub Project from Phase 0–9 columns.
2. Start **Phase 0** tasks 0.1–0.3.
3. Immediately after Phase 0 sign-off → **Phase 1.1** (ESLint config) — highest ROI, lowest risk.

---

## Related Docs

- `PRODUCTION_CHECKLIST.md` — gate checklist per deploy
- `PRE_LAUNCH_RUNBOOK.md` — incident procedures
- `API.md` — sync with Phase 6 OpenAPI
- `SECURITY.md` — replace in Phase 2.6
- `SUCCESS_METRICS.md` — wire to Phase 4 metrics

---

*Last updated: 2026-06-03 · Owner: The Chattala Core Team*
