# Step 1 — New Vercel Account Cutover (Section A)

> **Audit ref:** Primary GO blocker · `LAUNCH_READINESS_REPORT.md` blocker #6  
> **Estimated time:** 2–4 hours (DNS propagation may add up to 24h)  
> **Prerequisite:** Neon, Upstash, UploadThing, Brevo, Google OAuth credentials ready

---

## সংক্ষিপ্ত সারাংশ

পুরনো Vercel account **ব্যবহার করবেন না**। নতুন account-এ project import → env vars → deploy → DNS cutover।

---

## Checklist

### A.1 — New Vercel account / team

- [ ] Create new Vercel account or team (do **not** reuse blocked/old account)
- [ ] Connect GitHub: `abumdselim/thechattala`
- [ ] Copy **Team ID** → save for GitHub secret `VERCEL_ORG_ID`

### A.2 — Import production project

| Setting | Value |
|---------|-------|
| Project name | `thechattala` |
| Production branch | `main` |
| Framework | Next.js (auto-detected) |
| Build Command | `npm run build:vercel` (**from `vercel.json` — do not override**) |
| Install Command | `npm ci` |
| Root directory | `./` |

- [ ] Import from GitHub
- [ ] Copy **Project ID** → save for GitHub secret `VERCEL_PROJECT_ID`

### A.3 — Environment variables (production)

Vercel → Project → Settings → Environment Variables → **Production**

#### Required before first deploy

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon **pooled** connection |
| `DIRECT_URL` | Neon **direct** (migrations in `build:vercel`) |
| `AUTH_SECRET` | `openssl rand -base64 32` — rotate if old account compromised |
| `NEXTAUTH_SECRET` | Same as `AUTH_SECRET` or separate 32+ char secret |
| `NEXTAUTH_URL` | `https://www.thechattala.com` (or `*.vercel.app` for first test) |
| `NEXT_PUBLIC_APP_URL` | Must match public URL (email links) |
| ~~`NODE_ENV`~~ | **Do NOT set in Vercel env vars** — Vercel sets this automatically; breaks `npm ci` if set to `production` during install |
| `UPSTASH_REDIS_REST_URL` | Rate limit + cache |
| `UPSTASH_REDIS_REST_TOKEN` | |
| `UPLOADTHING_SECRET` | |
| `UPLOADTHING_APP_ID` | |
| `SMTP_HOST` | e.g. `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | |
| `SMTP_PASSWORD` | |
| `SMTP_FROM` | e.g. `hello@thechattala.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `PUSHER_APP_ID` | Real-time (cluster `ap2` recommended) |
| `NEXT_PUBLIC_PUSHER_KEY` | |
| `PUSHER_SECRET` | |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap2` |
| `NEXT_PUBLIC_APP_LOGO_URL` | Full URL to logo for emails |

#### Google OAuth (recommended at launch)

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `true` |

#### Defer until Step 5–6

| Variable | When |
|----------|------|
| `CRON_SECRET` | Step 5 — crons |
| `INNGEST_EVENT_KEY` | Step 6 — async jobs |
| `INNGEST_SIGNING_KEY` | Step 6 |
| `FEATURE_ASYNC_*` | Step 6 — start empty/false |

**Verify locally after pull:**

```bash
vercel login
vercel link                    # select new team + thechattala project
vercel env pull .env.production.local --environment=production
npm run verify:production-env
```

Expected: `All required production environment variables are set.`

### A.4 — Google OAuth console

If domain unchanged, verify in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
Authorized JavaScript origins:
  https://www.thechattala.com

Authorized redirect URIs:
  https://www.thechattala.com/api/auth/callback/google
```

For first test on `*.vercel.app`, add that origin + redirect temporarily.

- [ ] OAuth client verified for production domain

### A.5 — DNS cutover

1. Vercel → Project → Settings → Domains → Add `www.thechattala.com` (+ apex if needed)
2. Update DNS at registrar (A/CNAME per Vercel instructions)
3. Wait for SSL provisioning

- [ ] DNS points to **new** Vercel project
- [ ] HTTPS valid on `https://www.thechattala.com`

### A.6 — Decommission old Vercel

- [ ] Remove domain from **old** Vercel project
- [ ] Archive or delete old project
- [ ] Revoke old `VERCEL_TOKEN` in GitHub secrets (refresh in Step 4)

### A.7 — First deploy

**Option A (recommended):** push to `main` → Vercel auto-deploy

**Option B:** manual CLI

```bash
vercel deploy --prod
```

**Build log must show:**

- `migrate:deploy` succeeded (or "No pending migrations")
- `next build` completed without errors

- [ ] First production deploy green on new account

---

## Step 1 complete when

- [ ] A.1–A.7 checkboxes done
- [ ] Proceed to **Step 2:** `docs/launch/README.md` → run `npm run smoke:production`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on migrate | Check `DIRECT_URL` (not pooled); see `scripts/migrate-deploy.sh` |
| Auth redirect loop | `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` must match deployed URL |
| Google button missing | Set `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` in Vercel **and** redeploy |
| Rate limit errors in prod | Verify `UPSTASH_*` vars; prod fails closed on auth rate limits |
| Email links wrong domain | `NEXT_PUBLIC_APP_URL` must be production URL |

---

## Next step

→ [Step 2 — Post-deploy smoke (A.8)](./STEP_02_POST_DEPLOY_SMOKE.md)
