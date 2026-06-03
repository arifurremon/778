# ADR 005: Vercel Primary Hosting; Firebase App Hosting Legacy

**Status:** Accepted  
**Date:** 2026-03-13 (Phase 8)

## Context

The repository contains `apphosting.yaml` from an early Firebase App Hosting experiment. Production deployment guide (`docs/DEPLOYMENT.md`) standardizes on **Vercel + Neon + Upstash**.

Phase 8 requires either removing `apphosting.yaml` or documenting why Firebase coexists.

## Decision

**Vercel is the sole production hosting platform.**

- `main` → Vercel production project (auto-deploy or promote workflow).
- `staging` → separate Vercel project (see `docs/STAGING_ENVIRONMENT.md`).
- `apphosting.yaml` is **retained as reference only** — not used in CI/CD. See `docs/FIREBASE_APPHOSTING.md`.
- Firebase App Hosting is **not** a deployment target unless explicitly re-evaluated in a future ADR.

## Consequences

**Positive**

- Single deployment path reduces ops confusion.
- Aligns with existing CI, promotion workflow, and team skills.
- Edge middleware + Next.js 15 supported on Vercel.

**Negative**

- Firebase file may confuse new contributors — mitigated by doc + comment in yaml.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Dual deploy Vercel + Firebase | Double cost, drift, unclear canonical URL |
| Delete apphosting.yaml | Loses maxInstances reference; kept with deprecation notice |
| Firebase as primary | Roadmap explicitly defers Vercel account migration only |

## References

- `docs/DEPLOYMENT.md`, `docs/STAGING_ENVIRONMENT.md`, `apphosting.yaml`, `docs/FIREBASE_APPHOSTING.md`
