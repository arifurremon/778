# Database Index Audit — Phase 5.4

**Last updated:** 2026-06-03  
**Scope:** Hot paths for The Chattala (Neon Postgres)

## Methodology

1. Map application hot queries from API routes and `dashboard-metrics.ts`
2. Cross-check `prisma/schema.prisma` `@@index` definitions
3. Validate on staging with `EXPLAIN (ANALYZE, BUFFERS)` before adding new indexes

## Hot query → index coverage

| Query pattern | Route / module | Index(es) | Status |
|---------------|----------------|-----------|--------|
| User by email / username | Auth, register | `@unique` on `email`, `username` | ✅ |
| Session lookup | NextAuth | `Session` via adapter | ✅ |
| Posts feed by visibility + recency | Community | `Post(visibility)`, `Post(createdAt)`, `Post(authorId)` | ✅ |
| Flagged posts queue | Admin moderation | `Post(flagged)`, `moderationStatus` filter | ✅ |
| User registrations trend | Admin analytics | `User(createdAt)` + partial `deletedAt IS NULL` | ✅ |
| Shop by owner | `/api/shops/me` | `Shop.userId` unique | ✅ |
| Products by shop | Marketplace | FK `Product.shopId` | ✅ |
| Seller orders | Orders API | `Order(buyerId)`, `Order(shopId)`, `Order(status, createdAt)` | ✅ |
| Service bookings by client/expert | Bookings | `ServiceBooking(clientId)`, `(expertServiceId)` | ✅ |
| Notifications unread | Header bell | `Notification(userId, createdAt)`, `(userId, isRead)` | ✅ |
| Neighbour graph | Neighbours | `NeighbourConnection(senderId, status)`, `(receiverId, status)` | ✅ |
| Activity log retention purge | Cron | `ActivityLog(createdAt)`, `(userId, createdAt)` | ✅ |
| Audit log retention | Cron | `AuditLog(createdAt)` | ✅ |
| Consent ledger | Compliance | `ConsentRecord(userId, type, createdAt)` | ✅ |
| Password / email tokens | Auth flows | `User(emailToken, emailTokenExp)`, `(resetToken, resetTokenExp)` | ✅ |
| Messaging threads | Messages | `Conversation(participantA, updatedAt)`, `Message(conversationId, createdAt)` | ✅ |

## Recommended staging checks

Run on staging (replace params):

```sql
-- Feed
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM "Post"
WHERE "deletedAt" IS NULL AND visibility = 'PUBLIC'
ORDER BY "createdAt" DESC LIMIT 20;

-- Admin flagged queue
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM "Post"
WHERE "deletedAt" IS NULL AND ("flagged" = true OR "moderationStatus" = 'FLAGGED')
ORDER BY "createdAt" DESC LIMIT 50;

-- Seller orders
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM "Order" WHERE "shopId" = $1 ORDER BY "createdAt" DESC LIMIT 50;
```

**Healthy signs:** `Index Scan` or `Bitmap Index Scan`, low buffer read count, planning time < 5 ms.

**Action required:** Sequential Scan on large tables → add composite index matching `WHERE` + `ORDER BY`.

## Future candidates (monitor first)

| Pattern | Trigger to add index |
|---------|---------------------|
| `Post(location)` geo filters | If location-based feed ships |
| `Order(status, createdAt)` admin filters | If order queue page adds status tabs |
| Full-text search on posts | Phase 6+ search API — consider GIN/tsvector |

## Migration integrity (Phase 5.1)

Fresh databases must pass:

```bash
npm run migrate:verify-fresh
```

Legacy no-op migration `clean_old_users/` is documented in `prisma/migrations/README.md`.
