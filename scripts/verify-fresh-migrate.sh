#!/usr/bin/env bash
# Verifies prisma migrate deploy on an empty PostgreSQL database (Phase 5.1).
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required"
  exit 1
fi

echo "[migrate:verify-fresh] Applying all migrations to target database..."
npx prisma migrate deploy

echo "[migrate:verify-fresh] Running smoke query..."
npx tsx scripts/dr-drill-smoke.ts

echo "[migrate:verify-fresh] OK — fresh migrate deploy succeeded"
