# Architecture Decision Records (ADR)

> Index of significant technical decisions for The Chattala.

| ADR | Title | Status |
|-----|-------|--------|
| [001](./001-jwt-session-strategy.md) | JWT session strategy (Auth.js) | Accepted |
| [002](./002-csrf-mutation-protection.md) | CSRF via origin guard + custom header | Accepted |
| [003](./003-notification-dual-path.md) | Notification DB-first + Pusher fan-out | Accepted |
| [004](./004-inngest-async-job-queue.md) | Inngest for async jobs (Phase 7) | Accepted |
| [005](./005-vercel-primary-hosting.md) | Vercel primary; Firebase App Hosting legacy | Accepted |

## Format

Each ADR follows: **Context → Decision → Consequences → Alternatives considered**.

New ADRs: copy template from any existing file, increment number, link here.

## Related

- Phase 8.6 — `docs/ENTERPRISE_ROADMAP.md`
- Runbooks — `docs/runbooks/`
