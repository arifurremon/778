# Contributing to The Chattala

Thank you for your interest in contributing to **The Chattala** — Chittagong's hyperlocal city platform.

> This project is currently in **invite-only development**. All contributors must be approved by [Abu Md. Selim](https://github.com/abumdselim) before submitting pull requests.

---

## Table of Contents

- [Code Style](#code-style)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Security Guidelines](#security-guidelines)
- [Development Workflow](#development-workflow)

---

## Code Style

This project uses **ESLint** and **TypeScript strict mode**. All code must pass linting and type-checking before being merged.

### Key Rules

| Area | Rule |
|------|------|
| Language | TypeScript strict mode — no `any`, no implicit `undefined` |
| Formatting | ESLint config in `next.config.ts` (Next.js defaults + custom rules) |
| Components | React functional components only — no class components |
| Imports | Absolute imports via `@/` alias (configured in `tsconfig.json`) |
| CSS | Tailwind CSS utility classes — no inline styles |
| Server/Client | Explicitly mark components with `"use client"` or `"use server"` |
| DB queries | Always use `getDb()` factory — never import `prisma` directly |

### Run Before Every Commit

```bash
npm run lint        # ESLint check
npm run typecheck   # TypeScript strict check (tsc --noEmit)
npm run test        # Vitest unit/integration tests
```

---

## Commit Message Format

This project follows the **Conventional Commits** specification.

### Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | A new feature or user-facing change |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, missing semicolons — no logic change |
| `refactor` | Code restructuring without new feature or bug fix |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, config changes |
| `perf` | Performance improvements |
| `security` | Security patches or hardening |

### Scope Examples

`auth`, `posts`, `profile`, `admin`, `db`, `api`, `ui`, `deps`

### Examples

```
feat(auth): add email verification on registration
fix(posts): prevent XSS in post body via DOMPurify
docs(api): document neighbours endpoints
chore(deps): upgrade next-auth to beta.31
security(api): add rate limiting to forgot-password route
```

---

## Pull Request Process

### 1. Branch Naming

Create branches from `main` using the format:

```
<type>/<short-description>
```

Examples:
- `feat/shop-product-catalog`
- `fix/auth-redirect-loop`
- `docs/api-endpoints`

### 2. Before Opening a PR

- [ ] Code passes `npm run lint`
- [ ] Code passes `npm run typecheck`
- [ ] All existing tests pass: `npm run test`
- [ ] New tests added for new features or bug fixes
- [ ] No secrets or credentials committed
- [ ] `DIRECT_URL` / `DATABASE_URL` not hardcoded anywhere
- [ ] PR description explains **what** and **why**, not just **what**

### 3. PR Description Template

```markdown
## Summary
Brief description of the change.

## Motivation
Why is this change needed?

## Changes Made
- [ ] Change 1
- [ ] Change 2

## Testing
How was this tested? Include test commands or screenshots.

## Screenshots (if UI change)
Before / After

## Checklist
- [ ] Lint passes
- [ ] TypeScript passes
- [ ] Tests pass
- [ ] No secrets committed
```

### 4. Review Process

- At least **1 approval** required from a maintainer before merging
- Reviewers are assigned automatically based on CODEOWNERS
- Address all review comments before requesting a re-review
- Squash and merge into `main`

---

## Testing Requirements

All PRs that add or modify features **must** include corresponding tests.

### Test Structure

```
src/
├── __tests__/
│   └── api/                    # Integration tests for API routes
│       ├── auth.test.ts
│       ├── posts.test.ts
│       └── user.test.ts
└── tests/
    └── unit/                   # Unit tests for utilities and hooks
e2e/
└── *.spec.ts                   # End-to-end Playwright tests
```

### Running Tests

```bash
npm run test                    # All unit + integration tests (Vitest)
npm run test:coverage           # Tests with coverage report
npm run test:integration        # Integration tests only
npm run test:e2e                # End-to-end tests (Playwright)
npm run test:e2e:headed         # E2E with browser visible (debugging)
```

### Coverage Expectations

- **API routes**: 80%+ coverage required
- **Auth flows**: 100% critical path coverage
- **Utility functions in `src/lib/`**: 90%+ coverage
- **UI components**: Snapshot tests for critical components

### Test Isolation

- Integration tests must use a **separate test database** — never run against production
- Use `beforeEach`/`afterEach` hooks to clean up database state
- Seed data is in `prisma/seed-admin.ts`

---

## Security Guidelines

The following changes **always require explicit maintainer review**, even with approval from other contributors:

### Always Requires Security Review

| Change Type | Reason |
|-------------|--------|
| New API routes | Check for auth guards, CSRF, rate limiting |
| Authentication changes | Risk of auth bypass |
| Prisma schema changes | Risk of data exposure or injection |
| Middleware changes | Controls access to all protected routes |
| New environment variables | Ensure secrets are not exposed to client |
| File upload changes | Risk of malicious file upload |
| Admin route changes | Privilege escalation risk |
| Rate limit configuration | DoS protection |

### Security Best Practices

1. **Never** expose server-only secrets to client components
2. **Always** validate and sanitize user inputs with Zod schemas
3. **Always** check `getServerSession()` in API routes before DB queries
4. **Use** `isomorphic-dompurify` for any user-generated HTML content
5. **Never** log sensitive data (passwords, tokens, full DB URLs)
6. **Always** use `DIRECT_URL` for migrations only — `DATABASE_URL` (pooled) for app queries
7. Rate-limit all auth endpoints — the `@upstash/ratelimit` package is already configured

### Reporting Vulnerabilities

**Do NOT open a public GitHub issue for security vulnerabilities.**

Email: security@thechattala.com (or contact the maintainer directly via LinkedIn)

---

## Development Workflow

```
main (protected)
  └── feat/your-feature         ← Create branch here
        └── [develop & test]
              └── Pull Request  ← Open PR to main
                    └── Review & Approve
                          └── Squash & Merge → main
                                └── Vercel auto-deploys
```

### Local Dev Commands

```bash
npm run dev             # Start dev server on http://localhost:9002
npx prisma studio       # Open Prisma database GUI
npx prisma migrate dev  # Apply pending schema migrations
npx prisma db push      # Push schema without migration history (dev only)
npm run build           # Validate production build
```

---

*The Chattala — Built for Chittagong. Engineered for the future.*

*© 2026 [Inievo Technologies](https://inievo.com). All rights reserved.*
