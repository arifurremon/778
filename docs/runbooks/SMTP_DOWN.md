# Runbook: SMTP / Email Down

**Severity:** P2 — registration and password reset blocked  
**Owner:** On-call engineer  
**Last updated:** 2026-03-12

## Symptoms

- Users report missing verification / reset emails
- `/admin/health` email configuration check fails
- API returns `emailSent: false` on register
- SMTP provider dashboard shows bounces or auth failures

## Immediate actions (0–15 min)

1. Check SMTP provider status (Brevo / Resend / host panel)
2. Verify env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
3. Send test email from provider console
4. Check Sentry for mail errors tagged `sendVerificationEmail` / `sendPasswordResetEmail`

## Mitigation

| Step | Action |
|------|--------|
| 1 | Rotate SMTP password / API key if auth failing |
| 2 | Switch to backup SMTP credentials documented in `docs/DEPLOYMENT_ENV.md` |
| 3 | Manually verify critical admin accounts via DB `emailVerified` (break-glass only) |
| 4 | Post status: new sign-ups may be delayed |

## Recovery verification

```bash
# Trigger forgot-password on staging test user; confirm delivery
curl -X POST https://<staging>/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "origin: https://<staging>" \
  -H "x-csrf-token: test" \
  -d '{"email":"e2e@chattala.test"}'
```

## Post-incident

- Review bounce/spam rates in SMTP dashboard
- Confirm DKIM/SPF records unchanged
