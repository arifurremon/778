#!/usr/bin/env bash
# Verify staging environment variables (Phase B.2)
# Usage:
#   vercel env pull .env.staging.local --environment=preview  # or staging project
#   npm run verify:staging-env
#   npm run verify:staging-env -- path/to/.env

set -euo pipefail

ENV_FILE="${1:-.env.staging.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file not found: ${ENV_FILE}"
  echo "Create from .env.staging.example or run:"
  echo "  vercel env pull .env.staging.local --environment=preview"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

REQUIRED_VARS=(
  DATABASE_URL
  DIRECT_URL
  AUTH_SECRET
  NEXTAUTH_URL
  NEXT_PUBLIC_APP_URL
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  UPLOADTHING_SECRET
  UPLOADTHING_APP_ID
  SMTP_HOST
  SMTP_USER
  SMTP_PASSWORD
  SMTP_FROM
  NEXT_PUBLIC_SENTRY_DSN
  PUSHER_APP_ID
  NEXT_PUBLIC_PUSHER_KEY
  PUSHER_SECRET
)

PHASE_B_VARS=(
  CRON_SECRET
  INNGEST_EVENT_KEY
  INNGEST_SIGNING_KEY
)

missing=0
phase_b_missing=0

is_set() {
  local name="$1"
  local value="${!name-}"
  [[ -n "${value// /}" ]]
}

echo "🔍 Verifying staging env: ${ENV_FILE}"
echo "--- Required (staging deploy)"

for var in "${REQUIRED_VARS[@]}"; do
  if is_set "$var"; then
    echo "✅ ${var}"
  else
    echo "❌ ${var}"
    missing=$((missing + 1))
  fi
done

echo "--- Phase B (crons + Inngest)"
for var in "${PHASE_B_VARS[@]}"; do
  if is_set "$var"; then
    echo "✅ ${var}"
  else
    echo "⏸️  ${var} — required before Phase B sign-off"
    phase_b_missing=$((phase_b_missing + 1))
  fi
done

echo "--- Staging URL checks"
if is_set NEXTAUTH_URL && is_set NEXT_PUBLIC_APP_URL; then
  auth_url="${NEXTAUTH_URL%/}"
  app_url="${NEXT_PUBLIC_APP_URL%/}"
  if [[ "$auth_url" == "$app_url" ]]; then
    echo "✅ NEXTAUTH_URL matches NEXT_PUBLIC_APP_URL (${app_url})"
  else
    echo "❌ NEXTAUTH_URL (${auth_url}) != NEXT_PUBLIC_APP_URL (${app_url})"
    missing=$((missing + 1))
  fi

  if [[ "$app_url" == *"thechattala.com"* ]] && [[ "$app_url" != *"staging"* ]] && [[ "$app_url" != *"vercel.app"* ]]; then
    echo "⚠️  NEXT_PUBLIC_APP_URL looks like production — use a staging-specific URL"
  fi
fi

if is_set AUTH_SECRET && [[ ${#AUTH_SECRET} -lt 32 ]]; then
  echo "❌ AUTH_SECRET must be at least 32 characters"
  missing=$((missing + 1))
fi

echo "---"
if [[ "$missing" -gt 0 ]]; then
  echo "FAILED: ${missing} staging variable(s) missing or invalid."
  exit 1
fi

if [[ "$phase_b_missing" -gt 0 ]]; then
  echo "PASSED staging core env. Phase B vars still missing: ${phase_b_missing} (see docs/launch/PHASE_B_OPS.md)"
  exit 2
fi

echo "Staging env complete (including Phase B vars)."
