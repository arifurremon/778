#!/usr/bin/env bash
# Live cron endpoint verification (Phase B.3)
# Requires CRON_SECRET in env file or environment.
# Usage:
#   DEPLOY_URL=https://www.thechattala.com npm run verify:cron-live
#   DEPLOY_URL=... CRON_SECRET=... bash scripts/verify-cron-live.sh

set -euo pipefail

BASE_URL="${DEPLOY_URL:-${STAGING_URL:-${1:-}}}"
ENV_FILE="${ENV_FILE:-.env.production.local}"

if [[ -z "$BASE_URL" ]]; then
  echo "ERROR: Set DEPLOY_URL or STAGING_URL"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

if [[ -z "${CRON_SECRET:-}" ]] && [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "ERROR: CRON_SECRET not set. Add to Vercel env or pass in environment."
  exit 1
fi

check_cron() {
  local name="$1"
  local path="$2"
  local url="${BASE_URL}${path}"
  local status
  local body

  body=$(curl -s -w "\n%{http_code}" --max-time 30 \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    "$url")
  status=$(echo "$body" | tail -n1)
  body=$(echo "$body" | sed '$d')

  if [[ "$status" == "200" ]] && echo "$body" | grep -q '"success"'; then
    echo "✅ ${name} (${status}) — ${body}"
    return 0
  fi

  if [[ "$status" == "401" ]]; then
    echo "❌ ${name} — 401 Unauthorized (CRON_SECRET mismatch on Vercel?)"
  else
    echo "❌ ${name} — HTTP ${status} — ${body}"
  fi
  return 1
}

echo "🔍 Cron live checks against ${BASE_URL}"
echo "---"

fail=0
check_cron "Webhook retry" "/api/cron/webhook-retry" || fail=1
check_cron "Data retention" "/api/cron/data-retention" || fail=1

echo "---"
if [[ "$fail" -ne 0 ]]; then
  echo "Cron verification failed. Ensure:"
  echo "  1. CRON_SECRET set in Vercel (same value as local env file)"
  echo "  2. vercel.json crons deployed (Vercel Pro may be required)"
  echo "  3. Latest deploy includes cron routes"
  exit 1
fi

echo "Cron endpoints OK."
