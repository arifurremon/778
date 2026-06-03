#!/usr/bin/env bash
# Post-deploy smoke tests — Step 2 / Phase B validation
# Usage:
#   DEPLOY_URL=https://www.thechattala.com npm run smoke:production
#   bash scripts/post-deploy-smoke.sh https://your-project.vercel.app

set -euo pipefail

BASE_URL="${DEPLOY_URL:-${STAGING_URL:-${1:-}}}"
if [[ -z "$BASE_URL" ]]; then
  echo "ERROR: Set DEPLOY_URL (or STAGING_URL) or pass URL as first argument."
  exit 1
fi

BASE_URL="${BASE_URL%/}"
PASS=0
FAIL=0

# shellcheck source=scripts/smoke-common.sh
source "$(dirname "$0")/smoke-common.sh"

echo "🔍 Post-deploy smoke tests against ${BASE_URL}"
echo "---"

run_production_smoke_checks

if ! print_smoke_summary; then
  echo "Manual checks still required: credentials login, Google OAuth, email verify, upload."
  echo "See docs/launch/STEP_02_POST_DEPLOY_SMOKE.md"
  exit 1
fi

echo "Next: manual auth/upload checks in docs/launch/STEP_02_POST_DEPLOY_SMOKE.md"
echo "Phase B: npm run verify:phase-b-env && npm run verify:cron-live"
