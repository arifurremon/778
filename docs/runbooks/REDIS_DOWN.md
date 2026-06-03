# Runbook: Redis (Upstash) Down

**Severity:** P2 — degraded performance, rate limits may fail open  
**Owner:** On-call engineer  
**Last updated:** 2026-03-12

## Symptoms

- `/api/health` shows `redis: fail` with overall status `degraded`
- Cache misses increase; pages feel slower
- Rate limiter logs warnings; auth still works
- Sentry alert: `Health check degraded` or elevated p95 latency

## Immediate actions (0–15 min)

1. Confirm scope: `curl -s https://<app>/api/health | jq`
2. Check [Upstash Console](https://console.upstash.com/) → database status + REST URL/token
3. Verify env vars on host: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Post status update if user-visible slowness persists > 5 min

## Mitigation

| Step | Action |
|------|--------|
| 1 | Rotate REST token in Upstash if compromised; redeploy env |
| 2 | Create new Upstash database in same region if instance corrupted |
| 3 | Temporarily disable non-critical cached routes (posts feed) via feature flag |
| 4 | Scale app instances if latency from DB fallback |

The app **continues to serve** without Redis — queries fall through to Postgres (`src/lib/cache.ts`).

## Recovery verification

```bash
curl -s https://<app>/api/health | jq '.checks.redis'
# expect status "pass"
```

## Post-incident

- Record root cause + duration in incident log
- Review cache TTLs if stampede occurred after recovery
- Confirm Sentry alert auto-resolved
