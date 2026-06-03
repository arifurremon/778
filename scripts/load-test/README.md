# k6 Load Test — Phase 7

## Prerequisites

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/):

```bash
# macOS
brew install k6

# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Run against staging (recommended)

```bash
npm run loadtest:k6 -- -e BASE_URL=https://YOUR-STAGING-URL
```

Or directly:

```bash
k6 run -e BASE_URL=https://YOUR-STAGING-URL scripts/load-test/k6-smoke.js
```

## Scenarios covered

| Flow | Endpoint |
|------|----------|
| Health probe | `GET /api/v1/health` |
| Shop browse | `GET /api/v1/shops` |
| Services list | `GET /api/v1/services` |
| Directory | `GET /api/v1/directory` |

## Pass criteria (Phase 7 exit)

- **p95 latency** < 2 seconds
- **Error rate** < 0.1%
- **100 VUs** sustained for 1 minute (see `options.stages` in script)

## Notes

- Authenticated flows (booking, feed) require session cookies — extend script with `setup()` login for full E2E load.
- Run from CI only when `BASE_URL` secret is configured (see `docs/DEFERRED_POST_COMPLETION_TASKS.md`).
