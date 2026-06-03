# Phase E — Fee Decimal + Performance Indexes

> **Prerequisite:** Phase D complete (60% coverage gate)  
> **Goal:** Store expert fees as `DECIMAL(10,2)`; add pagination indexes for messages and orders.

---

## What changed (code)

| Area | Change |
|------|--------|
| **ExpertService.fee** | `String` → `Decimal @db.Decimal(10, 2)` |
| **ServiceBooking.fee** | Same migration (snapshot at booking time) |
| **Migration** | `20260610100004_phase_e_fee_decimal_indexes` — regex strip `৳`/commas on backfill |
| **API input** | Accepts `"1500"`, `"৳1,500"`, or `1500` via `feeZodField` |
| **API output** | JSON returns numeric `fee` (BDT amount); UI formats with `formatFeeBdt()` |
| **Indexes** | `Message(conversationId, createdAt)`, `Order(status, createdAt)` |

---

## New utilities

```
src/lib/money/fee.ts          — parseFeeInput, decimalToNumber, formatFeeBdt, feeZodField
src/lib/service-serializer.ts — serializeExpertService(s)
src/__tests__/lib/fee.test.ts — parsing + display tests
```

---

## Deploy checklist (you)

After merge + Vercel deploy:

```bash
npx prisma migrate deploy
DEPLOY_URL=https://www.thechattala.com npm run smoke:production
```

**Verify:** Register or view an expert service — fee should display as `৳1,500` style in UI while API returns `1500`.

**Rollback note:** Reverting drops DECIMAL precision; string fees would need a forward migration.

---

## Index rationale

| Index | Query |
|-------|--------|
| `Message_conversationId_createdAt_idx` | Paginated thread load (`ORDER BY createdAt DESC`) |
| `Order_status_createdAt_idx` | Seller/admin order queues filtered by status |

See also [`docs/DATA_INDEX_AUDIT.md`](../DATA_INDEX_AUDIT.md).

---

## Next: Phase F

- GO sign-off checklist
- First 10 real users onboarding
- Final smoke + monitoring

See [`PHASE_F_OPS.md`](./PHASE_F_OPS.md) and [`docs/AUDIT_EXECUTION_PLAN.md`](../AUDIT_EXECUTION_PLAN.md).
