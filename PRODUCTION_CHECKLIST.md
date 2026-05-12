# Production Readiness Checklist

> **Project:** The Chattala — v1.0.0
> **Date:** 2026-05-12
> **Lead:** Abu Md. Selim (Engineering Lead, Inievo Technologies)
>
> Mark each item ✅ (pass), ❌ (fail), or ⚠️ (partial / acceptable risk).
> **All CRITICAL items must be ✅ before launch.**

---

## 🔴 CRITICAL — Must Pass Before Launch

Failure of any single item here is a **NO-GO**.

### Build & Code Quality

- [ ] `npm run build` completes with **zero errors** (no `--ignore-build-errors` suppression)
- [ ] `npm run typecheck` passes — **0 TypeScript errors** (strict mode enabled in `tsconfig.json`)
- [ ] `npm run lint` passes — **0 ESLint errors**
- [ ] No `console.log`, `console.error`, or `debugger` statements in production API routes (`src/app/api/`)
- [ ] No commented-out dead code blocks in critical paths

### Security — Authentication & Sessions

- [ ] **Password hashing verified**: All passwords stored via `bcryptjs` — never plaintext (verify in `src/app/api/auth/register/route.ts`)
- [ ] **Session management tested**: NextAuth session cookie is `HttpOnly`, `Secure`, `SameSite=Lax` in production
- [ ] **CSRF protection enabled**: All `POST`/`PATCH`/`DELETE` NextAuth endpoints validate CSRF token
- [ ] `AUTH_SECRET` is a cryptographically random string ≥ 32 characters in production Vercel env
- [ ] Google OAuth redirect URIs locked to production domain only

### Security — Input & Output

- [ ] **XSS prevention**: No `dangerouslySetInnerHTML` usage without explicit DOMPurify sanitization
- [ ] **Input sanitization**: `isomorphic-dompurify` applied to all user-generated content (post bodies, profile bio)
- [ ] **Zod validation schemas** applied to every API route handler (`src/app/api/**/route.ts`)
- [ ] SQL injection: impossible via Prisma ORM parameterized queries — verify no raw SQL (`$queryRaw`) with interpolated user data
- [ ] File upload validation: UploadThing restricts file types and sizes (no arbitrary file execution)

### Security — Rate Limiting

- [ ] **Rate limiting enabled** on `/api/auth/register` (5 req / 15 min per IP via Upstash Redis)
- [ ] **Rate limiting enabled** on `/api/auth/forgot-password` (5 req / 15 min per IP)
- [ ] Upstash Redis `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set in Vercel production env
- [ ] Rate limit failures return `429` with `Retry-After` header (not `500`)

### Security — HTTP Headers

- [ ] Security headers configured in `next.config.ts`:
  - [ ] `X-Frame-Options: DENY` (clickjacking protection)
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Content-Security-Policy` header set (at minimum, restrict `default-src 'self'`)
  - [ ] `Strict-Transport-Security` (HSTS) enabled for production

### Error Handling & Monitoring

- [ ] **Error boundary implemented**: `src/app/error.tsx` exists and shows a user-friendly fallback
- [ ] **Not-found page**: `src/app/not-found.tsx` exists
- [ ] **Sentry configured**: `NEXT_PUBLIC_SENTRY_DSN` set in Vercel production env
- [ ] Sentry receives events — verify with a test error or the Sentry test button
- [ ] All API routes return structured JSON errors (no raw exception stack traces to client)
- [ ] 500 errors do **not** expose internal Prisma error messages or DB connection strings

### Database

- [ ] **Database migrations tested**: `npx prisma migrate deploy` runs successfully against production DB
- [ ] `DATABASE_URL` uses Neon **pooled** connection string in production
- [ ] `DIRECT_URL` uses Neon **direct** connection string (migrations only)
- [ ] Database backup enabled in Neon console (automatic backups)
- [ ] Schema has no pending un-applied migrations (`npx prisma migrate status` shows "Database schema is up to date")

### Testing

- [ ] `npm run test` passes — **0 failing tests**
- [ ] Test coverage ≥ **70%** on API routes (`src/__tests__/api/`)
- [ ] Auth flow integration tests pass (`src/__tests__/api/auth.test.ts`)
- [ ] Post creation integration tests pass

---

## 🟡 HIGH PRIORITY — Should Pass (80%+ Required)

These items should be resolved before launch. More than 2 failures here is a **NO-GO**.

### Performance

- [ ] Page load time (LCP) < **3 seconds** on 4G mobile connection (verify via Vercel Analytics or Lighthouse)
- [ ] `/dashboard` Time to Interactive (TTI) < 4 seconds
- [ ] `npm run build` output shows no route exceeding **150 kB** first load JS
- [ ] Images served via Next.js `<Image>` component (auto-optimization, WebP conversion)
- [ ] Vercel Edge Network caching verified for static assets

### API Reliability

- [ ] **Every API route** has a `try/catch` block and returns structured error responses
- [ ] Prisma queries in API routes use `getDb()` factory — not a singleton import
- [ ] All authenticated endpoints return `401` (not `500`) when session is missing
- [ ] Admin-only routes return `403` when `isAdmin` is `false`
- [ ] API endpoints tested for all documented error cases

### Database Optimisation

- [ ] Database indexes added for frequently queried fields:
  - [ ] `User.email` (unique — auto-indexed by Prisma)
  - [ ] `User.username` (unique — auto-indexed by Prisma)
  - [ ] `Post.authorId` (foreign key)
  - [ ] `Post.createdAt` (for feed ordering)
  - [ ] `NeighbourRequest.senderId` and `receiverId`
- [ ] `npx prisma studio` shows no orphaned records in junction tables

### Caching & Infrastructure

- [ ] Upstash Redis connection verified (not just set in env — actually responds to ping)
- [ ] Vercel Serverless Function cold-start times acceptable (< 1s for auth routes)
- [ ] `force-dynamic` export set on all authenticated page routes (prevents stale SSR cache)

### Email

- [ ] Password reset email sends successfully in production SMTP (test with a real email)
- [ ] Email verification flow tested end-to-end
- [ ] SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) set in production Vercel env
- [ ] Emails render correctly on Gmail, Outlook, Apple Mail (basic check)
- [ ] `SMTP_FROM` is a verified sender domain

### File Uploads

- [ ] UploadThing restricts to allowed MIME types (JPEG, PNG, WebP for images)
- [ ] Maximum file size enforced (4 MB for avatars, 8 MB for post images)
- [ ] Old profile images **automatically deleted** from UploadThing CDN on replacement
- [ ] `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` set in production Vercel env

### Admin Features

- [ ] Admin dashboard (`/admin`) accessible only to `isAdmin: true` users
- [ ] Admin user management (view/verify/delete users) working
- [ ] Admin post management (view/delete posts) working
- [ ] Admin shop management (view/approve shops) working
- [ ] At least one admin user seeded in production database

### Accessibility

- [ ] All interactive elements have `aria-label` or descriptive text
- [ ] Color contrast ratio ≥ 4.5:1 for body text (WCAG 2.1 AA)
- [ ] Keyboard navigation works for forms (login, signup, post creation)
- [ ] Focus indicators visible on all interactive elements
- [ ] `<img>` and `<Image>` elements have descriptive `alt` attributes

### Mobile & Responsive Design

- [ ] Dashboard layout tested on 375px (iPhone SE) viewport
- [ ] Community feed scrollable and readable on mobile
- [ ] Bottom navigation bar working correctly on mobile
- [ ] Forms (login, signup, post creation) usable on mobile keyboards
- [ ] No horizontal scroll on any page at 375px width

---

## 🟢 MEDIUM PRIORITY — Nice to Have

These will not block launch but should be tracked as post-launch improvements.

### Testing & Coverage

- [ ] Test coverage ≥ **80%** overall (currently targeting 70%+)
- [ ] End-to-end Playwright tests passing (`npm run test:e2e`)
- [ ] Visual regression tests for key UI components
- [ ] Load testing completed: 1000+ concurrent users without degradation

### Observability

- [ ] Vercel Web Vitals monitoring enabled (LCP, FID, CLS tracked)
- [ ] Custom Sentry performance transactions for critical flows (login, post creation)
- [ ] Database query performance monitoring via Neon console

### Analytics

- [ ] Analytics platform configured (Vercel Analytics or Google Analytics)
- [ ] Conversion funnel tracking (landing → signup → first post)
- [ ] User engagement metrics baseline established

### Advanced Infrastructure

- [ ] Feature flags system implemented (for gradual rollouts)
- [ ] Blue-green deployment strategy documented
- [ ] Disaster recovery runbook tested (see `DEPLOYMENT.md`)
- [ ] Staging environment mirrors production exactly (separate Neon branch + Vercel preview)
- [ ] CDN cache invalidation strategy documented

---

## Checklist Summary

| Priority | Total Items | Required Pass Rate | Actual Status |
|----------|-------------|-------------------|---------------|
| 🔴 Critical | ~35 | **100%** | `___/35` |
| 🟡 High Priority | ~30 | **≥80% (24/30)** | `___/30` |
| 🟢 Medium Priority | ~15 | No minimum | `___/15` |

**Overall Score:** `___/80` (Critical + High)

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | Abu Md. Selim | | |
| Security Reviewer | | | |
| DevOps Lead | | | |
| QA Lead | | | |

---

*Checklist version: 1.0.0 — Update this file whenever new critical routes or features are added.*
