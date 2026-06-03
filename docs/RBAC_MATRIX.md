# The Chattala — RBAC Matrix (v0.1 Draft)

> **Version:** 0.1 (Phase 0 baseline)  
> **Last updated:** 2026-03-12  
> **Status:** Draft — **not yet implemented in code**  
> **Target implementation:** Phase 2 (`Role` enum + permissions)

---

## 1. Purpose

This document defines the **intended** role-based access control model for The Chattala. Today the codebase uses **boolean flags** on the `User` model (`isAdmin`, `isSeller`, `isServiceProvider`, `isVerified`). Phase 2 will migrate to a formal `Role` enum and optional permissions table.

---

## 2. Role Definitions

| Role | DB Representation (current) | DB Representation (target) | Description |
|------|----------------------------|---------------------------|-------------|
| **user** | Default (no flags) | `role: USER` | Registered resident; community, neighbours, messaging |
| **seller** | `isSeller = true` + approved `Shop` | `role: SELLER` | Shop owner; products, orders, seller dashboard |
| **expert** | `isServiceProvider = true` + approved `ExpertService` | `role: EXPERT` | Service provider; bookings, expert profile |
| **moderator** | *(not implemented)* | `role: MODERATOR` | Content moderation only; no user admin |
| **admin** | `isAdmin = true` | `role: ADMIN` | Full platform administration |
| **superadmin** | *(not implemented)* | `role: SUPERADMIN` | System settings, role assignment, audit export |

### Role Hierarchy

```
superadmin > admin > moderator > expert ≈ seller > user
```

A user may hold **multiple capability flags** (e.g. seller + expert). Target model: primary `role` + `capabilities[]` JSON or join table.

---

## 3. Permission Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Allowed |
| ⚠️ | Allowed with conditions (ownership, neighbour status, etc.) |
| ❌ | Denied |
| 🔜 | Planned (Phase 2+) |

---

## 4. Community & Social

| Resource / Action | user | seller | expert | moderator | admin | superadmin |
|-------------------|------|--------|--------|-----------|-------|------------|
| View public posts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create post | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own post | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own post | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete any post | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Flag / report post | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comment on post | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| React to post/comment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save / follow post | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send neighbour request | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accept neighbour request | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Block user | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Direct message | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |

*⚠️ = subject to privacy settings and neighbour/connection rules.*

---

## 5. Marketplace (Shops & Orders)

| Resource / Action | user | seller | expert | moderator | admin | superadmin |
|-------------------|------|--------|--------|-----------|-------|------------|
| Browse shops/products | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register shop | ✅ | 🔜 | ✅ | ❌ | ✅ | ✅ |
| Manage own shop | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Add/edit products | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Place order | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own orders (buyer) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View seller orders | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Update order status | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ |
| Write product review | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Verify / reject shop | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

*⚠️ seller = own shop only; requires `registrationStatus = APPROVED`.*

---

## 6. Expert Services & Bookings

| Resource / Action | user | seller | expert | moderator | admin | superadmin |
|-------------------|------|--------|--------|-----------|-------|------------|
| Browse services | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register as expert | ✅ | ✅ | 🔜 | ❌ | ✅ | ✅ |
| Manage own service profile | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| Book a service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own bookings (client) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View expert bookings | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| Accept/decline booking | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| Verify / reject expert | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 7. User Account & Profile

| Resource / Action | user | seller | expert | moderator | admin | superadmin |
|-------------------|------|--------|--------|-----------|-------|------------|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View public profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own account | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export own data (GDPR) | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 | ✅ |
| Suspend user | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Promote to admin | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Assign moderator role | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 8. Admin Panel

| Resource / Action | user | seller | expert | moderator | admin | superadmin |
|-------------------|------|--------|--------|-----------|-------|------------|
| Access `/admin` UI | ❌ | ❌ | ❌ | ⚠️ | ✅ | ✅ |
| Dashboard stats | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| User list / search | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Bulk user actions | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Content moderation queue | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Shop/service verification | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analytics (all) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit log (read) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| System settings | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| MFA enforcement config | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

*⚠️ moderator = content routes only (`/admin/posts`, `/admin/comments`); not yet split in code.*

---

## 9. Public / Unauthenticated

| Resource / Action | Anonymous | Authenticated |
|-------------------|-----------|---------------|
| Home, directory, emergency | ✅ | ✅ |
| Shop/service browse | ✅ | ✅ |
| Register / login | ✅ | N/A |
| Contact / suggestions forms | ✅ (rate-limited) | ✅ |
| Post creation | ❌ | ✅ |
| Admin panel | ❌ | ❌ (unless admin) |

---

## 10. API Guard Mapping (Current Implementation)

| Guard function | Used for | File |
|----------------|----------|------|
| *(none)* | Public GET routes | directory, emergency, some listings |
| `auth()` | Legacy session check | ~14 routes (Phase 2 migration target) |
| `requireActiveSession()` | Authenticated reads/writes | Majority of user routes |
| `requireActiveMutation()` | POST/PATCH/DELETE with CSRF | Posts, orders, neighbours, etc. |
| `requireAdmin()` | All `/api/admin/**` | `src/lib/admin-auth.ts` |
| Ownership check | Resource-specific | e.g. shop owner, post author, booking parties |

---

## 11. Migration Plan (Phase 2)

1. Add Prisma `enum Role { USER SELLER EXPERT MODERATOR ADMIN SUPERADMIN }`
2. Backfill: `isAdmin=true` → `ADMIN`; `isSeller=true` → add `SELLER` capability
3. Replace direct `isAdmin` checks with `hasPermission(user, 'admin.users.suspend')`
4. Add `moderator` role with scoped admin routes
5. Enforce MFA for `ADMIN` and `SUPERADMIN` roles
6. Update JWT callback to include `role` (display only; DB always authoritative)

---

## 12. Sign-Off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Engineering Lead | Abu Md. Selim | 2026-03-12 | `[ ] Pending` |
| Security Lead | — | | `[ ] Pending` |
| Product Lead | — | | `[ ] Pending` |

---

*© 2026 Inievo Technologies — RBAC Matrix v0.1*
