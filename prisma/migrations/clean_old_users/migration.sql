-- This migration was a one-time data-cleanup script that ran successfully
-- against the production database on 2026-05-xx. The original SQL used
-- "Account" and "Session" (Prisma model names) instead of the actual mapped
-- table names "accounts" and "sessions", which causes the shadow database
-- used by `prisma migrate dev` to fail when replaying history from scratch.
--
-- The migration is marked as applied in the _prisma_migrations table, so the
-- production schema is correct. This file is replaced with a no-op so that
-- `prisma migrate dev` can replay the full migration history cleanly.

SELECT 1; -- no-op
