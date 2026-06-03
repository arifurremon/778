# ADR 001: JWT Session Strategy (Auth.js)

**Status:** Accepted  
**Date:** 2026-03-12 (documented Phase 8)  
**Deciders:** Engineering Lead — Inievo Technologies

## Context

The Chattala uses NextAuth.js v5 (Auth.js) with **CredentialsProvider** (email + password). We need sessions that work in Next.js middleware (Edge) and API routes while supporting role checks and account lifecycle (suspend, delete).

Database sessions (`strategy: "database"`) are incompatible with CredentialsProvider in Auth.js — passwords are verified in `authorize()` and no OAuth account linking flow exists for credentials-only users.

## Decision

Use **JWT session strategy** (`session: { strategy: "jwt" }` in `src/auth.config.ts`):

- Session token stored in `authjs.session-token` cookie (httpOnly).
- JWT enriched in `jwt` callback with `id`, `username`, `isAdmin`, `profileImage`.
- `src/lib/auth.ts` re-validates user against DB on each JWT refresh (suspend/delete invalidates token via `token.invalid`).
- PrismaAdapter retained for Account model (future OAuth) but not for session storage.

## Consequences

**Positive**

- Edge-compatible middleware auth checks.
- Works with CredentialsProvider.
- Fast session reads (no DB hit on every request — DB check on JWT callback refresh).

**Negative**

- JWT cannot be centrally revoked instantly without blocklist (mitigated by short maxAge + DB invalidation flag).
- Token size must stay small (limited session update fields).

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Database sessions only | Incompatible with CredentialsProvider |
| Custom session table + rolling tokens | Higher implementation cost vs Auth.js JWT |
| Stateless JWT without DB re-check | Cannot enforce suspend/delete in real time |

## References

- `src/auth.config.ts`, `src/lib/auth.ts`
- `docs/RBAC_MATRIX.md`
