#!/usr/bin/env bash
# Verify required production environment variables before first Vercel deploy.
# Usage:
#   vercel env pull .env.production.local --environment=production
#   npm run verify:production-env
#   npm run verify:production-env -- path/to/.env

set -euo pipefail

ENV_FILE="${1:-.env.production.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file not found: ${ENV_FILE}"
  echo "Run: vercel env pull .env.production.local --environment=production"
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

RECOMMENDED_VARS=(
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED
  NEXTAUTH_SECRET
  NEXT_PUBLIC_PUSHER_CLUSTER
  NEXT_PUBLIC_APP_LOGO_URL
)

DEFERRED_VARS=(
  CRON_SECRET
  INNGEST_EVENT_KEY
  INNGEST_SIGNING_KEY
)

missing=0
warnings=0

is_set() {
  local name="$1"
  local value="${!name-}"
  [[ -n "${value// /}" ]]
}

echo "🔍 Verifying production env: ${ENV_FILE}"
echo "---"

for var in "${REQUIRED_VARS[@]}"; do
  if is_set "$var"; then
    echo "✅ ${var}"
  else
    echo "❌ ${var} — required for first deploy"
    missing=$((missing + 1))
  fi
done

echo "--- Recommended (Step 1 launch)"
for var in "${RECOMMENDED_VARS[@]}"; do
  if is_set "$var"; then
    echo "✅ ${var}"
  else
    echo "⚠️  ${var} — recommended; some features disabled without it"
    warnings=$((warnings + 1))
  fi
done

echo "--- Deferred (Step 5–6)"
for var in "${DEFERRED_VARS[@]}"; do
  if is_set "$var"; then
    echo "✅ ${var} (early — OK)"
  else
    echo "⏸️  ${var} — add in Step 5–6"
  fi
done

echo "--- URL consistency"
if is_set NEXTAUTH_URL && is_set NEXT_PUBLIC_APP_URL; then
  auth_url="${NEXTAUTH_URL%/}"
  app_url="${NEXT_PUBLIC_APP_URL%/}"
  if [[ "$auth_url" == "$app_url" ]]; then
    echo "✅ NEXTAUTH_URL matches NEXT_PUBLIC_APP_URL"
  else
    echo "⚠️  NEXTAUTH_URL (${auth_url}) != NEXT_PUBLIC_APP_URL (${app_url})"
    warnings=$((warnings + 1))
  fi
fi

echo "--- AUTH_SECRET strength"
if is_set AUTH_SECRET; then
  if [[ ${#AUTH_SECRET} -ge 32 ]]; then
    echo "✅ AUTH_SECRET length OK (${#AUTH_SECRET} chars)"
  else
    echo "❌ AUTH_SECRET must be at least 32 characters (got ${#AUTH_SECRET})"
    missing=$((missing + 1))
  fi
fi

echo "--- Google OAuth wiring"
if is_set GOOGLE_CLIENT_ID && is_set GOOGLE_CLIENT_SECRET; then
  if [[ "${NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED:-}" == "true" ]]; then
    echo "✅ Google OAuth server + client flag aligned"
  else
    echo "⚠️  GOOGLE_* set but NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED is not 'true' (button hidden)"
    warnings=$((warnings + 1))
  fi
fi

echo "---"
if [[ "$missing" -gt 0 ]]; then
  echo "FAILED: ${missing} required variable(s) missing."
  exit 1
fi

if [[ "$warnings" -gt 0 ]]; then
  echo "PASSED with ${warnings} warning(s). Review recommended vars before launch."
else
  echo "All required production environment variables are set."
fi
