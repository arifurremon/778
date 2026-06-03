#!/usr/bin/env bash
# Phase B.2 — Create and push staging branch from main
# Usage: bash scripts/setup-staging-branch.sh

set -euo pipefail

echo "Creating staging branch from origin/main..."

git fetch origin main

if git show-ref --verify --quiet refs/heads/staging; then
  echo "Local staging branch exists. Updating from main..."
  git checkout staging
  git merge origin/main --no-edit
else
  git checkout -b staging origin/main
fi

echo ""
echo "Review diff, then push:"
echo "  git push -u origin staging"
echo ""
echo "Next: create Vercel staging project — docs/launch/PHASE_B_OPS.md section B.2"
