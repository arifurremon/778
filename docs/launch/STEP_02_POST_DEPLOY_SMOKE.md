# Step 2 — Post-Deploy Smoke (Section A.8)

> **Prerequisite:** Step 1 complete — live deployment URL available  
> **Estimated time:** 15–30 minutes

---

## Automated smoke (7+ checks)

```bash
# Replace with your live URL
DEPLOY_URL=https://www.thechattala.com npm run smoke:production
```

Expected output: **All post-deploy smoke checks passed.**

### What it checks

| Check | Endpoint |
|-------|----------|
| Health (v1) | `/api/v1/health` |
| Health (legacy) | `/api/health` |
| OpenAPI | `/api/openapi.json` |
| Shops | `/api/v1/shops?page=1&limit=6` |
| Services | `/api/v1/services?page=1&limit=6` |
| Directory | `/api/v1/directory?type=tourism` |
| Emergency | `/api/v1/emergency` |
| Status page | `/status` |
| Login page | `/login` |
| API docs | `/api/docs` |

---

## Manual verification (required)

- [ ] **Credentials login** — existing user or test account
- [ ] **Google login** — if OAuth enabled (Step 1 A.4)
- [ ] **Registration flow** — new user → verification email received
- [ ] **Avatar upload** — UploadThing works
- [ ] **Sentry** — trigger test error; event appears in dashboard (optional)
- [ ] **Build log** — `migrate:deploy` OK on this deployment

---

## Database drill (quick)

```bash
npm run drill:smoke
```

Expected: DB `SELECT 1` pass (uses env from `.env.production.local` or `.env.local`).

---

## Step 2 complete when

- [ ] `npm run smoke:production` → 0 failures
- [ ] Manual auth + upload checks pass
- [ ] Mark Step 2 done in `docs/launch/README.md`
- [ ] Proceed to **Step 3:** Staging (`docs/STAGING_ENVIRONMENT.md`)

---

## Next step

→ Step 3 runbook (coming after Step 2 sign-off) or `docs/STAGING_ENVIRONMENT.md`
