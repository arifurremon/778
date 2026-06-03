# Phase D — Coverage 60% + Dashboard Split

> **Prerequisite:** Phase C complete (role-only RBAC)  
> **Goal:** Raise API coverage gate to 60%, split `DashboardLayout`, reduce `any` in admin hot paths.

---

## What changed (code)

| Area | Change |
|------|--------|
| **Coverage** | 37 new integration tests across admin, shops, orders, posts, services, activity, messages |
| **Gate** | `vitest.config.ts` thresholds → **60% lines/stmts**, **55% functions**, **45% branches** |
| **Dashboard** | `dashboard-view.tsx` split into sidebar, nav config, notifications, search menu |
| **`any` cleanup** | Admin user PATCH, services list/pending, audit log route |

---

## New test files

```
src/__tests__/api/admin-users-detail.integration.test.ts
src/__tests__/api/admin-users-suspend.integration.test.ts
src/__tests__/api/admin-users-audit.integration.test.ts
src/__tests__/api/orders-detail.integration.test.ts
src/__tests__/api/posts-detail.integration.test.ts
src/__tests__/api/shops-products.integration.test.ts
src/__tests__/api/services-me.integration.test.ts
src/__tests__/api/services-detail.integration.test.ts
src/__tests__/api/activity-read.integration.test.ts
src/__tests__/api/messages-read.integration.test.ts
src/__tests__/components/dashboard-nav-config.test.ts
```

---

## Dashboard module map

| File | Responsibility |
|------|----------------|
| `dashboard-view.tsx` | Shell: header, content area, mobile overlays |
| `dashboard-sidebar.tsx` | Sidebar + profile footer |
| `dashboard-nav-config.ts` | Nav items, role filtering, greeting |
| `dashboard-nav-item.tsx` | Single nav link row |
| `dashboard-notification-center.tsx` | Bell popover / mobile sheet |
| `dashboard-search-menu.tsx` | Quick search categories |

Import path unchanged: `@/components/dashboard/dashboard-view` (used by `protected-route.tsx`).

---

## Verification

```bash
npm run validate
npm run test:coverage
```

Expected summary (approx):

- Lines ≥ **60%**
- Statements ≥ **60%**
- Functions ≥ **55%**
- Branches ≥ **45%**

---

## Remaining backlog (Phase E+)

- Post react/follow/save routes still at 0% in coverage scope
- `ExpertService.fee` → Decimal migration (Phase E)
- More `any` in hooks/components (~80 left)

See [`docs/AUDIT_EXECUTION_PLAN.md`](../AUDIT_EXECUTION_PLAN.md).
