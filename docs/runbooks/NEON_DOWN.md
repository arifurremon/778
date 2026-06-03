# Runbook: Neon Postgres Down

**Severity:** P1 — full outage  
**Owner:** On-call engineer  
**Last updated:** 2026-03-12

## Symptoms

- `/api/health` returns **503** with `database: fail`
- All authenticated pages fail; Sentry error spike
- Prisma errors: connection timeout, `ECONNREFUSED`, `57P01`

## Immediate actions (0–15 min)

1. Confirm: `curl -i https://<app>/api/health`
2. Check [Neon Console](https://console.neon.tech/) → project status, compute suspend, connection limits
3. Verify `DATABASE_URL` on hosting provider matches Neon dashboard
4. Enable maintenance banner on status page

## Mitigation

| Step | Action |
|------|--------|
| 1 | Wake suspended Neon compute (free tier auto-suspend) |
| 2 | Restore from PITR branch if data corruption suspected (see DR drill doc) |
| 3 | Point `DATABASE_URL` to read replica / restored branch after validation |
| 4 | Roll back last deploy if migration caused failure |

## PITR restore (summary)

1. Neon Console → **Branches** → **Restore** to timestamp before incident
2. Name branch `recovery-YYYYMMDD-HHMM`
3. Run smoke tests: `npx prisma migrate deploy`, `npm run test:integration`
4. Swap `DATABASE_URL` in staging first, then production
5. Record RTO/RPO in `LAUNCH_READINESS_REPORT.md`

## Recovery verification

```bash
curl -s https://<app>/api/health | jq '.checks.database'
npx prisma db execute --stdin <<< "SELECT 1"
```

## Post-incident

- Verify no partial writes; audit `AuditLog` around incident window
- Schedule schema review if migration-related
- Complete post-mortem within 48 hours
