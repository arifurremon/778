#!/usr/bin/env bash
# Phase B — verify CRON_SECRET + Inngest keys (production or staging)
# Usage:
#   npm run verify:phase-b-env
#   npm run verify:phase-b-env -- .env.staging.local

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

PHASE_B_REQUIRED=(
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

echo "🔍 Phase B env verification: ${ENV_FILE}"
echo "---"

for var in "${PHASE_B_REQUIRED[@]}"; do
  if is_set "$var"; then
    echo "✅ ${var}"
  else
    echo "❌ ${var} — required for Phase B"
    missing=$((missing + 1))
  fi
done

if is_set CRON_SECRET && [[ ${#CRON_SECRET} -lt 32 ]]; then
  echo "❌ CRON_SECRET must be at least 32 characters (generate: openssl rand -base64 32)"
  missing=$((missing + 1))
elif is_set CRON_SECRET; then
  echo "✅ CRON_SECRET length OK (${#CRON_SECRET} chars)"
fi

echo "--- Async feature flags (recommended staging-first)"
for flag in FEATURE_ASYNC_MAIL FEATURE_ASYNC_JOBS FEATURE_ASYNC_RETENTION; do
  value="${!flag-}"
  if [[ -z "$value" ]]; then
    echo "ℹ️  ${flag} unset (uses default from Inngest config detection)"
  elif [[ "$value" == "true" ]]; then
    echo "⚠️  ${flag}=true — ensure Inngest sync verified before production"
    warnings=$((warnings + 1))
  else
    echo "✅ ${flag}=${value}"
  fi
done

echo "---"
if [[ "$missing" -gt 0 ]]; then
  echo "FAILED: ${missing} Phase B variable(s) missing."
  echo "See docs/launch/PHASE_B_OPS.md sections B.3–B.4"
  exit 1
fi

if [[ "$warnings" -gt 0 ]]; then
  echo "Phase B vars set. Review async flags before enabling in production."
else
  echo "Phase B environment variables OK."
fi
