# ADR 002: CSRF Protection for Cookie-Authenticated Mutations

**Status:** Accepted  
**Date:** 2026-03-12 (documented Phase 8)

## Context

Session cookies are sent automatically on same-site requests. Cross-site form POST attacks could mutate data if API routes only check session presence.

NextAuth provides CSRF for `/api/auth/*` routes only — not application JSON APIs.

## Decision

Implement **defense in depth** in `src/lib/csrf.ts`:

1. All `POST`/`PUT`/`PATCH`/`DELETE` routes use `requireActiveMutation()` or `requireAdminMutation()`.
2. Mutations require header `x-csrf-token` (client fetches from `/api/auth/csrf` via `getCsrfToken()`).
3. **Same-origin check:** `Origin` or `Referer` must match `NEXT_PUBLIC_APP_URL` origin.
4. Missing token or origin mismatch → `403`.

This is a **custom header + origin guard**, not double-submit cookie alone.

## Consequences

**Positive**

- Simple for SPA/fetch clients already sending JSON + custom headers.
- Blocks classic cross-site form POST (no custom header).
- Centralized in session-guards — consistent across ~90 mutation routes.

**Negative**

- External API clients using session cookies must implement CSRF fetch (B2B integrators should use API keys instead).
- Tests must include `x-csrf-token` + `origin` headers (see integration tests).

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| SameSite=Strict cookie only | Insufficient for all attack vectors; breaks some flows |
| Synchronizer token in body | Duplicates header approach; JSON APIs prefer headers |
| Disable CSRF for API | Unacceptable security risk |

## References

- `src/lib/csrf.ts`, `src/lib/session-guards.ts`, `src/lib/api.ts`
- ADR 001 (JWT sessions)
