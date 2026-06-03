#!/usr/bin/env bash
# Staging smoke tests — CI + Phase B.2 validation
# Usage: STAGING_URL=https://staging.example.com npm run smoke:staging

set -euo pipefail

BASE_URL="${STAGING_URL:-${DEPLOY_URL:-${1:-}}}"
if [[ -z "$BASE_URL" ]]; then
  echo "ERROR: Set STAGING_URL (or DEPLOY_URL) or pass URL as first argument."
  exit 1
fi

BASE_URL="${BASE_URL%/}"
PASS=0
FAIL=0

# shellcheck source=scripts/smoke-common.sh
source "$(dirname "$0")/smoke-common.sh"

echo "🔍 Staging smoke tests against ${BASE_URL}"
echo "---"

run_core_smoke_checks
check_endpoint "Login page" "/login" "200"

if ! print_smoke_summary; then
  exit 1
fi

echo "Staging core checks OK. Run E2E: PLAYWRIGHT_BASE_URL=${BASE_URL} npm run test:e2e"
