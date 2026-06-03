# Phase C — Role-Only RBAC + Auth Pin

> **Prerequisite:** Phase B ops in progress (crons, staging, Inngest)  
> **Goal:** Remove legacy `isAdmin` column; use `User.role` as single admin authority; pin Auth.js v5 beta.

---

## What changed (code)

| Area | Change |
|------|--------|
| **Database** | Migration `20260610100003_phase_c_drop_is_admin` — backfill `role=ADMIN` where `isAdmin=true`, drop column |
| **RBAC** | `src/lib/rbac.ts` — `isAdminRole(role)` is the only admin check (no boolean fallback) |
| **Session** | JWT/session carry `role`; `isAdmin` removed from NextAuth types |
| **Admin API** | PATCH `/api/admin/users/[id]` accepts `{ role: "ADMIN" \| "USER" }` |
| **Seeds** | `seed-admin.ts`, `seed-staging.ts`, e2e global setup use `role` only |
| **next-auth** | Pinned to exact `5.0.0-beta.31` (latest v5; no stable v5 release yet) |

---

## Deploy checklist (you)

After merge to `main` and Vercel deploy:

```bash
# 1. Apply migration on production Neon
npx prisma migrate deploy

# 2. Smoke admin access
DEPLOY_URL=https://www.thechattala.com npm run smoke:production

# 3. Verify admin user still has access (login as admin, open /admin)
```

**Rollback note:** Do not roll back this migration without a DB restore — `isAdmin` column is dropped.

---

## next-auth version policy

| Version | Status |
|---------|--------|
| `4.24.x` | Stable, but **different API** (CredentialsProvider import path, config shape) |
| `5.0.0-beta.31` | Latest Auth.js v5 beta — **what we use** |

We stay on v5 beta because the codebase is built on Auth.js v5 (`auth.ts`, `auth.config.ts`, `@auth/core`). Downgrading to v4 would be a large rewrite with no security benefit today.

**When v5 stable ships:** bump to exact stable version, run full auth E2E + `npm run validate`.

---

## Verification commands

```bash
npx prisma generate
npm run validate

# Confirm no legacy isAdmin in app code (docs/history OK)
rg 'isAdmin' --glob '!docs/**' --glob '!*.md' --glob '!prisma/migrations/**'
# Expected: only isAdminRole() helper and local vars like `const isAdmin = isAdminRole(...)`
```

---

## Next: Phase D

- Test coverage → 60%
- Reduce `any` usage in hot paths
- Split `DashboardLayout` into smaller modules

See [`docs/AUDIT_EXECUTION_PLAN.md`](../AUDIT_EXECUTION_PLAN.md).
