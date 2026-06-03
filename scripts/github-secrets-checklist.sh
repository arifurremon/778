#!/usr/bin/env bash
# Phase B.1 — GitHub repository secrets checklist (print-only)
# Set at: GitHub → Settings → Secrets and variables → Actions

cat <<'EOF'
🔐 GitHub Secrets Checklist — Phase B.1
Repository: abumdselim/thechattala
Path: Settings → Secrets and variables → Actions → Repository secrets

REQUIRED for CI deploy + smoke:
  VERCEL_TOKEN              — Vercel → Account Settings → Tokens
  VERCEL_ORG_ID             — Vercel → Team Settings → General
  VERCEL_PROJECT_ID         — Production project → Settings → General
  VERCEL_STAGING_PROJECT_ID — Staging project → Settings → General (after B.2)
  STAGING_URL               — Live staging URL (after first staging deploy)

OPTIONAL:
  STAGING_DATABASE_URL      — Neon staging branch (backup-verify workflow)
  CODEQL_UPLOAD_SARIF      — Repository variable, not secret

ENVIRONMENTS (Settings → Environments):
  staging       — optional reviewers
  production    — REQUIRED reviewers (≥1) for promote workflow

After updating secrets:
  1. Re-run failed workflow or push to staging branch
  2. npm run smoke:staging (with STAGING_URL)
  3. Mark B.1 done in docs/launch/PHASE_B_OPS.md

EOF
