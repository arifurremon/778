#!/usr/bin/env bash
# Staging smoke tests — used by CI promotion workflow (Phase 8.2)
# Usage: STAGING_URL=https://staging.example.com bash scripts/staging-smoke.sh

set -euo pipefail

BASE_URL="${STAGING_URL:-${1:-}}"
if [[ -z "$BASE_URL" ]]; then
  echo "ERROR: Set STAGING_URL or pass URL as first argument."
  exit 1
fi

BASE_URL="${BASE_URL%/}"
PASS=0
FAIL=0

check_endpoint() {
  local name="$1"
  local path="$2"
  local expected="${3:-200}"
  local url="${BASE_URL}${path}"
  local status

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" || echo "000")

  if [[ "$status" == "$expected" ]]; then
    echo "✅ ${name} (${status})"
    PASS=$((PASS + 1))
  else
    echo "❌ ${name} — expected ${expected}, got ${status} — ${url}"
    FAIL=$((FAIL + 1))
  fi
}

echo "🔍 Staging smoke tests against ${BASE_URL}"
echo "---"

check_endpoint "Health (v1)" "/api/v1/health" "200"
check_endpoint "OpenAPI" "/api/openapi.json" "200"
check_endpoint "Shops list" "/api/v1/shops?page=1&limit=6" "200"
check_endpoint "Services list" "/api/v1/services?page=1&limit=6" "200"
check_endpoint "Directory" "/api/v1/directory?type=tourism" "200"
check_endpoint "Emergency" "/api/v1/emergency" "200"
check_endpoint "Status page" "/status" "200"

echo "---"
echo "Passed: ${PASS} | Failed: ${FAIL}"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

echo "All staging smoke checks passed."
