#!/usr/bin/env bash
# Phase F — GO readiness verification (local CI + optional production smoke)
#
# Usage:
#   npm run verify:go-readiness
#   DEPLOY_URL=https://www.thechattala.com npm run verify:go-readiness
#   SKIP_COVERAGE=1 npm run verify:go-readiness

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOCAL_PASS=0
LOCAL_FAIL=0
REMOTE_PASS=0
REMOTE_FAIL=0

run_step() {
  local name="$1"
  shift
  echo ""
  echo "▶ ${name}"
  if "$@"; then
    echo "✅ ${name}"
    LOCAL_PASS=$((LOCAL_PASS + 1))
  else
    echo "❌ ${name}"
    LOCAL_FAIL=$((LOCAL_FAIL + 1))
  fi
}

echo "═══════════════════════════════════════════════════════════"
echo " Phase F — GO Readiness Verification"
echo " $(date -u +"%Y-%m-%d %H:%M UTC")"
echo "═══════════════════════════════════════════════════════════"

echo ""
echo "── Local engineering gates ──"

run_step "Typecheck" npm run typecheck
run_step "Lint" npm run lint
run_step "Unit/integration tests" npm run test

if [[ "${SKIP_COVERAGE:-}" != "1" ]]; then
  run_step "Coverage gate (≥60%)" npm run test:coverage
else
  echo "⏭️  Coverage skipped (SKIP_COVERAGE=1)"
fi

run_step "Production build" npm run build

echo ""
echo "── Pending migrations (review before GO) ──"
if [[ -d prisma/migrations ]]; then
  pending_migrations=(
    "20260610100003_phase_c_drop_is_admin"
    "20260610100004_phase_e_fee_decimal_indexes"
  )
  for migration in "${pending_migrations[@]}"; do
    if [[ -d "prisma/migrations/${migration}" ]]; then
      echo "⏳ ${migration} — run \`npx prisma migrate deploy\` on production Neon"
    fi
  done
else
  echo "⚠️  No prisma/migrations directory found"
fi

DEPLOY_URL="${DEPLOY_URL:-${STAGING_URL:-}}"
if [[ -n "$DEPLOY_URL" ]]; then
  echo ""
  echo "── Remote smoke (${DEPLOY_URL}) ──"
  if DEPLOY_URL="$DEPLOY_URL" bash scripts/post-deploy-smoke.sh; then
    REMOTE_PASS=1
  else
    REMOTE_FAIL=1
  fi
else
  echo ""
  echo "⏭️  Remote smoke skipped — set DEPLOY_URL=https://www.thechattala.com"
fi

echo ""
echo "── Manual ops gates (cannot automate) ──"
manual_gates=(
  "Production migrations applied (Phase C + E)"
  "GitHub secrets refreshed (npm run checklist:github-secrets)"
  "CRON_SECRET in Vercel + npm run verify:cron-live"
  "Inngest keys + async flags configured"
  "Neon PITR drill recorded in LAUNCH_READINESS_REPORT.md"
  "On-call backup contact assigned"
  "First 10 users invite list ready (docs/launch/FIRST_10_USERS.md)"
  "Lead sign-offs in docs/launch/GO_SIGNOFF_CHECKLIST.md"
)

for gate in "${manual_gates[@]}"; do
  echo "⏳ ${gate}"
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo " Local:  ${LOCAL_PASS} passed | ${LOCAL_FAIL} failed"
if [[ -n "$DEPLOY_URL" ]]; then
  echo " Remote: ${REMOTE_PASS} passed | ${REMOTE_FAIL} failed"
fi
echo "═══════════════════════════════════════════════════════════"

if [[ "$LOCAL_FAIL" -gt 0 ]]; then
  echo ""
  echo "NO-GO: Fix local failures before sign-off."
  exit 1
fi

if [[ -n "$DEPLOY_URL" && "$REMOTE_FAIL" -gt 0 ]]; then
  echo ""
  echo "NO-GO: Fix production smoke failures."
  exit 1
fi

echo ""
echo "Engineering gates PASS. Complete manual ops + sign-offs for GO."
echo "Runbook: docs/launch/PHASE_F_OPS.md"
exit 0
