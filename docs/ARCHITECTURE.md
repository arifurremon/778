# The Chattala — System Architecture

> **Version:** 0.1 (Phase 0 baseline)  
> **Last updated:** 2026-03-12  
> **Status:** Draft — pending team review

---

## 1. Overview

The Chattala is a **hyperlocal city platform** for Chittagong, Bangladesh. It combines community social features, marketplace (shops/products/orders), expert services (bookings), messaging, notifications, and an admin moderation panel.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Prisma 7 · PostgreSQL (Neon) · NextAuth v5 · Upstash Redis · Pusher · UploadThing · Sentry

---

## 2. C4 Level 1 — System Context

```mermaid
C4Context
  title System Context — The Chattala

  Person(resident, "Resident / User", "Browses community, shops, services")
  Person(seller, "Shop Seller", "Manages shop, products, orders")
  Person(expert, "Service Expert", "Offers bookings and services")
  Person(admin, "Platform Admin", "Moderates content, verifies shops/services")

  System(chattala, "The Chattala Platform", "Hyperlocal city SaaS — web app + API")

  System_Ext(neon, "Neon PostgreSQL", "Primary data store")
  System_Ext(upstash, "Upstash Redis", "Rate limiting + optional cache")
  System_Ext(pusher, "Pusher", "Real-time notifications & messaging")
  System_Ext(uploadthing, "UploadThing", "Image/file CDN uploads")
  System_Ext(smtp, "Brevo SMTP", "Transactional email")
  System_Ext(sentry, "Sentry", "Error tracking & performance")
  System_Ext(vercel, "Vercel / Hosting", "Serverless deployment & CDN")
  System_Ext(ga, "Google Analytics", "Usage analytics (optional)")

  Rel(resident, chattala, "Uses via browser")
  Rel(seller, chattala, "Manages shop")
  Rel(expert, chattala, "Manages services")
  Rel(admin, chattala, "Admin panel")

  Rel(chattala, neon, "Reads/writes via Prisma")
  Rel(chattala, upstash, "Rate limit checks")
  Rel(chattala, pusher, "Publishes/subscribes events")
  Rel(chattala, uploadthing, "Uploads media")
  Rel(chattala, smtp, "Sends email")
  Rel(chattala, sentry, "Reports errors")
  Rel(chattala, vercel, "Hosted on")
  Rel(chattala, ga, "Page views (consent-gated — Phase 3)")
  Rel(chattala, health, "GET /api/health uptime probe (Phase 4)")
```

### External Actors

| Actor | Description |
|-------|-------------|
| **Resident** | Registered or anonymous visitor; community, directory, emergency info |
| **Shop Seller** | User with `isSeller=true` and approved `Shop` record |
| **Service Expert** | User with `isServiceProvider=true` and approved `ExpertService` |
| **Admin** | User with `isAdmin=true`; live DB check on every admin API call |

---

## 3. C4 Level 2 — Container Diagram

```mermaid
C4Container
  title Container Diagram — The Chattala

  Person(user, "User", "Browser client")

  Container_Boundary(app, "The Chattala (Next.js 15)") {
    Container(web, "Web UI", "React 19 / App Router", "SSR + client components")
    Container(api, "API Routes", "Next.js Route Handlers", "~90 REST endpoints under /api")
    Container(mw, "Middleware", "Next.js Edge", "Auth redirects, CSP headers")
    Container(auth, "Auth Module", "NextAuth v5", "JWT sessions, credentials provider")
    Container(services, "Domain Services", "TypeScript libs", "Notifications, rate-limit, guards")
  }

  ContainerDb(db, "PostgreSQL", "Neon", "Users, posts, shops, orders, messages")
  Container_Ext(redis, "Redis", "Upstash", "Rate limits")
  Container_Ext(pusher, "Pusher", "SaaS", "Real-time channels")
  Container_Ext(ut, "UploadThing", "SaaS", "File storage CDN")
  Container_Ext(sentry, "Sentry", "SaaS", "Observability")

  Rel(user, web, "HTTPS")
  Rel(user, api, "HTTPS / JSON")
  Rel(web, api, "fetch()")
  Rel(api, auth, "Session validation")
  Rel(api, services, "Business logic")
  Rel(services, db, "Prisma ORM")
  Rel(services, redis, "REST API")
  Rel(services, pusher, "Server SDK")
  Rel(api, ut, "Signed uploads")
  Rel(app, sentry, "SDK")
```

---

## 4. Key Subsystems

### 4.1 Authentication & Sessions

```
Browser → POST /api/auth/[...nextauth] → NextAuth (Credentials)
       → JWT cookie (HttpOnly, Secure, SameSite=Lax)
       → API routes call requireActiveSession() → live DB lookup (not JWT alone)
       → Admin routes call requireAdmin() → isAdmin from DB
```

| Component | Path | Role |
|-----------|------|------|
| Auth config | `src/auth.config.ts` | Pages, callbacks, session shape |
| Auth handlers | `src/lib/auth.ts` | Credentials provider, Prisma adapter |
| Session guards | `src/lib/session-guards.ts` | `requireActiveSession`, `requireActiveMutation` |
| Admin guard | `src/lib/admin-auth.ts` | `requireAdmin` — DB-backed privilege check |
| CSRF | `src/lib/csrf.ts` | Validates mutation requests |

**Security model:** JWT proves identity; **database is source of truth** for `isAdmin`, suspension, and deletion status.

### 4.2 Database Layer

| Item | Detail |
|------|--------|
| ORM | Prisma 7 with `@prisma/adapter-neon` |
| Driver | `@neondatabase/serverless` + WebSocket (`ws`) |
| Connection | `DATABASE_URL` (pooled) for runtime; `DIRECT_URL` for migrations |
| Factory | `src/lib/db.ts` — singleton PrismaClient (not Edge-safe) |
| Migrations | `prisma/migrations/`; `npm run migrate:deploy` on Vercel (`build:vercel`) and CI Postgres (`build:ci`); local `npm run build` is compile-only |

**Core entities:** User, Post, Comment, Shop, Product, Order, ExpertService, ServiceBooking, NeighbourConnection, Conversation, Message, Notification, AuditLog, ActivityLog.

### 4.3 Rate Limiting

| Component | Path |
|-----------|------|
| Config | `src/lib/rate-limit.ts` |
| Backend | Upstash Redis REST (`@upstash/ratelimit`) |
| Behavior | Production: fail-closed if Redis missing; Dev: mock allow |

**Wired routes (sample):** `/api/auth/register`, `/api/auth/forgot-password`, `/api/posts`, `/api/orders`, `/api/messages/**`.

**Gap (Phase 2):** Audit remaining ~70 mutation routes.

### 4.4 Real-Time (Pusher)

| Flow | Detail |
|------|--------|
| Auth | `POST /api/pusher/auth` — channel authorization |
| Client | `pusher-js` in React hooks (`use-messages`, notifications) |
| Server | `src/lib/pusher-server.ts` — event publish on notifications/messages |

### 4.5 File Uploads

| Component | Path |
|-----------|------|
| Route | `src/app/api/uploadthing/route.ts` |
| Core | `src/app/api/uploadthing/core.ts` — auth-gated upload handlers |
| CDN | UploadThing → `utfs.io` |

### 4.6 Notifications

| Component | Path |
|-----------|------|
| Service | `src/lib/notification-service.ts` |
| Pattern | `sendNotification()` → DB persist + Pusher push |
| API | `GET/PATCH /api/notifications/**` |

### 4.7 Admin Panel

| Area | Routes |
|------|--------|
| Users | `/api/admin/users/**` |
| Content | `/api/admin/posts/**`, `/api/admin/comments/**` |
| Marketplace | `/api/admin/shops/**`, `/api/admin/services/**` |
| Analytics | `/api/admin/analytics/**` (partially hardcoded — Phase 5) |
| Audit | `/api/admin/audit-log/**` |

All admin API routes require `requireAdmin()`.

---

## 5. Request Flow (Typical Authenticated Mutation)

```
1. Client sends POST /api/posts with session cookie + CSRF header
2. Route handler calls requireActiveMutation(req)
   a. validateCsrfRequest(req)
   b. auth() → JWT decode
   c. db.user.findUnique → check deletedAt, suspendedAt
3. rateLimiters.posts.limit(userId or IP)
4. Zod schema validates body
5. Prisma transaction writes Post
6. sendNotification() for followers/neighbours
7. JSON 201 response
```

---

## 6. Deployment Topology

```
GitHub (main) → GitHub Actions (CI + E2E + CodeQL)
             → Vercel / alternate host (production)
             → Neon PostgreSQL (ap-southeast-1)
             → Upstash Redis (global REST)
             → Pusher cluster
             → UploadThing CDN
             → Brevo SMTP
             → Sentry (error ingestion)
```

| Environment | Branch | Database | Purpose |
|-------------|--------|----------|---------|
| **Production** | `main` | Neon prod | Live users |
| **Staging** | `staging` (planned) | Neon branch | Pre-release QA |
| **CI** | PR branches | Ephemeral Postgres 16 | Tests + E2E |
| **Local** | feature/* | `.env` Neon dev or Docker Postgres | Development |

---

## 7. Security Boundaries

| Boundary | Rule |
|----------|------|
| Edge vs Node | `src/lib/db.ts` must not run on Edge runtime |
| Admin privilege | Always `requireAdmin()` + DB lookup |
| User privilege | `requireActiveSession()` before any user-scoped mutation |
| Public reads | Directory, emergency, some posts — no auth required |
| Secrets | `AUTH_SECRET`, `DATABASE_URL`, Redis tokens — Vercel env only |

---

## 8. Known Gaps (Enterprise Roadmap)

| Gap | Target Phase |
|-----|--------------|
| Nonce-based CSP | Phase 2 |
| Role enum + permissions | Phase 2 |
| MFA for admins | Phase 2 |
| `/api/health` | ✅ Phase 4 — public DB + Redis probe |
| OpenAPI spec | Phase 6 |
| Job queue (email, retention) | Phase 7 |
| Staging environment | Phase 8 |

---

## 9. Related Documents

- [`ENTERPRISE_ROADMAP.md`](./ENTERPRISE_ROADMAP.md) — 9-phase upgrade plan
- [`RBAC_MATRIX.md`](./RBAC_MATRIX.md) — Role permissions draft
- [`BASELINE_AUDIT.md`](./BASELINE_AUDIT.md) — Current scores
- [`BRANCH_STRATEGY.md`](./BRANCH_STRATEGY.md) — Git workflow
- [`../API.md`](../API.md) — API reference (partial)

---

*© 2026 Inievo Technologies — Internal Architecture Document*
