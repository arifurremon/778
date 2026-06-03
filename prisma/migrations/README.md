# Prisma Migrations

## Fresh install path

CI and local verification use:

```bash
npm run migrate:verify-fresh
```

This runs `prisma migrate deploy` against an empty Postgres instance (see `.github/workflows/ci.yml`).

## Quarantined / legacy migrations

| Folder | Status | Notes |
|--------|--------|-------|
| `clean_old_users/` | **Quarantined (no-op)** | One-time production cleanup (2026-05). Original SQL referenced wrong table names and breaks shadow DB replay. Replaced with `SELECT 1;` no-op. **Do not delete** — `_prisma_migrations` history depends on this folder name. |

If a migration must be retired from fresh installs in the future:

1. Replace SQL with a documented no-op (as above), **or**
2. Squash history in a coordinated maintenance window (never rename applied migration folders).

## Adding migrations

```bash
npx prisma migrate dev --name descriptive_name
```

Always verify fresh deploy:

```bash
npm run migrate:verify-fresh
```
