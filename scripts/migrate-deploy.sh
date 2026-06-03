#!/usr/bin/env bash
# Apply Prisma migrations with Neon-safe retries (advisory lock P1002).
# Usage: bash scripts/migrate-deploy.sh
set -euo pipefail

MAX_ATTEMPTS="${MIGRATE_MAX_ATTEMPTS:-5}"
RETRY_DELAY_SEC="${MIGRATE_RETRY_DELAY_SEC:-15}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required for prisma migrate deploy."
  exit 1
fi

# Neon: migrations should use the direct (non-pooler) connection when available.
MIGRATE_URL="${DATABASE_URL}"
if [[ -n "${DIRECT_URL:-}" ]]; then
  MIGRATE_URL="${DIRECT_URL}"
  echo "[migrate:deploy] Using DIRECT_URL for advisory-lock-safe migration."
else
  echo "[migrate:deploy] DIRECT_URL not set — using DATABASE_URL (OK for CI/local Postgres)."
fi

attempt=1
while [[ "$attempt" -le "$MAX_ATTEMPTS" ]]; do
  echo "[migrate:deploy] Attempt ${attempt}/${MAX_ATTEMPTS}..."
  set +e
  output="$(DATABASE_URL="${MIGRATE_URL}" npx prisma migrate deploy 2>&1)"
  status=$?
  set -e

  if [[ "$status" -eq 0 ]]; then
    echo "$output"
    echo "[migrate:deploy] OK"
    exit 0
  fi

  echo "$output"

  if [[ "$output" == *"P1002"* || "$output" == *"advisory lock"* || "$output" == *"Timed out"* ]]; then
    if [[ "$attempt" -lt "$MAX_ATTEMPTS" ]]; then
      echo "[migrate:deploy] Advisory lock busy — retrying in ${RETRY_DELAY_SEC}s..."
      sleep "$RETRY_DELAY_SEC"
      attempt=$((attempt + 1))
      continue
    fi
  fi

  echo "[migrate:deploy] FAILED (exit ${status})"
  exit "$status"
done
