# Step B.5 — Secret Rotation Checklist

> **When:** Production secrets were pasted in chat, shared in docs, or old hosting account was compromised.  
> **Time:** ~1–2 hours + propagation wait

---

## Priority 1 — Rotate immediately

| Secret | Where to rotate | Update in Vercel |
|--------|-----------------|------------------|
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Production + Staging |
| `CRON_SECRET` | `openssl rand -base64 32` | Production + Staging |
| `DATABASE_URL` password | Neon Console → Reset password | Production + Staging |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Reset token | Production + Staging |
| `PUSHER_SECRET` | Pusher dashboard → App keys | Production + Staging |
| `UPLOADTHING_SECRET` | UploadThing dashboard | Production + Staging |
| `SMTP_PASSWORD` | Brevo/Resend provider | Production + Staging |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth credentials | Production + Staging |
| `INNGEST_SIGNING_KEY` | Inngest dashboard | Production + Staging |

---

## Priority 2 — Review / rotate if exposed

| Secret | Action |
|--------|--------|
| `INNGEST_EVENT_KEY` | Regenerate in Inngest if leaked |
| `SENTRY_DSN` | Rotate project DSN if needed (low risk) |
| GitHub `VERCEL_TOKEN` | Revoke old token; create new |

---

## After rotation

1. **Redeploy** production + staging (env changes require redeploy)
2. **Invalidate sessions** — users must re-login (AUTH_SECRET change)
3. **Verify:**
   ```bash
   npm run verify:production-env
   DEPLOY_URL=https://www.thechattala.com npm run smoke:production
   DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live
   ```
4. **Manual:** login, register email, Google OAuth, file upload
5. Mark B.5 complete in `docs/launch/PHASE_B_OPS.md`

---

## Do not rotate via git

Never commit secrets. Use Vercel Environment Variables only.

```bash
vercel env pull .env.production.local --environment=production
# verify locally — do not commit this file
```

---

## Neon connection string note

After Neon password reset, update both:

- `DATABASE_URL` (pooled)
- `DIRECT_URL` (direct, for migrations)

Then trigger redeploy so `build:vercel` migrate step succeeds.
