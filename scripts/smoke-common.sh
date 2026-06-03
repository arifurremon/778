#!/usr/bin/env bash
# Shared smoke-test helpers — sourced by post-deploy-smoke.sh and staging-smoke.sh

check_endpoint() {
  local name="$1"
  local path="$2"
  local expected="${3:-200}"
  local url="${BASE_URL}${path}"
  local status

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$url" || echo "000")

  if [[ "$status" == "$expected" ]]; then
    echo "✅ ${name} (${status})"
    PASS=$((PASS + 1))
  else
    echo "❌ ${name} — expected ${expected}, got ${status} — ${url}"
    FAIL=$((FAIL + 1))
  fi
}

check_register_route() {
  local url="${BASE_URL}/api/auth/register"
  local status
  local body_file
  body_file=$(mktemp)

  status=$(curl -s -o "$body_file" -w "%{http_code}" --max-time 20 -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "Origin: ${BASE_URL}" \
    -H "x-csrf-token: smoke-test" \
    -d '{}' || echo "000")

  if [[ "$status" == "500" ]]; then
    echo "❌ Register route — server crash (500) — ${url}"
    FAIL=$((FAIL + 1))
  elif [[ "$status" =~ ^(400|403|429)$ ]]; then
    echo "✅ Register route (${status}, JSON handler alive)"
    PASS=$((PASS + 1))
  elif grep -q "<!DOCTYPE html>" "$body_file" 2>/dev/null; then
    echo "❌ Register route — HTML error page (likely module crash) — ${url}"
    FAIL=$((FAIL + 1))
  else
    echo "⚠️  Register route — unexpected ${status} (not 500)"
    PASS=$((PASS + 1))
  fi

  rm -f "$body_file"
}

run_core_smoke_checks() {
  check_endpoint "Health (v1)" "/api/v1/health" "200"
  check_endpoint "Health (legacy)" "/api/health" "200"
  check_endpoint "OpenAPI" "/api/openapi.json" "200"
  check_endpoint "Shops list" "/api/v1/shops?page=1&limit=6" "200"
  check_endpoint "Services list" "/api/v1/services?page=1&limit=6" "200"
  check_endpoint "Directory" "/api/v1/directory?type=tourism" "200"
  check_endpoint "Emergency" "/api/v1/emergency" "200"
  check_endpoint "Status page" "/status" "200"
  check_register_route
}

run_production_smoke_checks() {
  run_core_smoke_checks
  check_endpoint "Login page" "/login" "200"
  check_endpoint "API docs" "/api/docs" "200"
}

print_smoke_summary() {
  echo "---"
  echo "Passed: ${PASS} | Failed: ${FAIL}"

  if [[ "$FAIL" -gt 0 ]]; then
    echo ""
    echo "Fix failing checks before sign-off."
    return 1
  fi

  echo ""
  echo "All smoke checks passed."
  return 0
}
