# Branch Strategy — The Chattala

> **Version:** 1.0  
> **Effective:** 2026-03-12 (Phase 0)  
> **Owner:** Engineering Lead — Inievo Technologies

---

## 1. Branch Model

```
main          ← production-ready; protected; auto-deploys to production
staging       ← pre-release QA; mirrors production env (Phase 8)
feat/*        ← feature work
fix/*         ← bug fixes
chore/*       ← tooling, docs, CI
hotfix/*      ← urgent production fixes (branch from main)
```

---

## 2. Branch Rules

### `main` (Production)

| Rule | Detail |
|------|--------|
| **Protection** | Required PR; no direct pushes |
| **Required checks** | CI (typecheck + tests), E2E, CodeQL |
| **Reviews** | ≥ 1 approval (Engineering Lead or delegate) |
| **Merge strategy** | Squash merge preferred |
| **Deploy** | Auto-deploy to production host on merge |
| **Tags** | `v1.x.y` tags cut from `main` at release |

### `staging` (Pre-Production — Phase 8)

| Rule | Detail |
|------|--------|
| **Purpose** | QA, DR drills, stakeholder demos |
| **Source** | Merge `main` → `staging` weekly, or feature PRs targeting `staging` first |
| **Database** | Separate Neon branch (not production data) |
| **Deploy** | Separate Vercel/hosting project |

### Feature Branches

| Pattern | Example | Lifetime |
|---------|---------|----------|
| `feat/<scope>` | `feat/phase1-eslint-ci` | Delete after merge |
| `fix/<issue>` | `fix/migration-index` | Delete after merge |
| `chore/<task>` | `chore/phase0-baseline` | Delete after merge |
| `hotfix/<issue>` | `hotfix/auth-session-leak` | Merge to `main` + backport to `staging` |

**Naming convention:** lowercase, hyphen-separated, include phase number for enterprise work:
- `feat/phase1-eslint-ci`
- `feat/phase2-rbac-enum`

---

## 3. Pull Request Workflow

```
1. Create branch from latest main
      git checkout main && git pull && git checkout -b feat/phase1-eslint-ci

2. Implement + test locally
      npm run validate && npm run build:ci

3. Push and open PR → main
      - Fill PR template (if present)
      - Link to roadmap task (Phase N.M)
      - Request review

4. CI must pass (validate, E2E, CodeQL)
      - Phase 1+: lint + build also required

5. Squash merge → main
      - Delete feature branch
      - Tag if release milestone
```

---

## 4. Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer: Closes #123]
```

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Tooling, deps, CI |
| `test` | Tests only |
| `refactor` | Code change, no behavior change |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

**Enterprise phase commits:**
```
feat(phase0): baseline audit & governance docs
ci(phase1): add eslint and build to CI workflow
feat(phase2): add Role enum and migrate isAdmin checks
```

---

## 5. Release & Hotfix Process

### Scheduled Release (v1.x.0)

1. Complete phase exit criteria
2. Update `CHANGELOG.md` (when created in Phase 1)
3. Tag: `git tag v1.1.0 && git push origin v1.1.0`
4. Deploy from tag
5. Update `LAUNCH_READINESS_REPORT.md` sign-offs

### Hotfix (Production Incident)

1. Branch from `main`: `hotfix/<issue>`
2. Minimal fix + test
3. PR to `main` — expedited review
4. Merge → auto-deploy
5. Post-mortem within 24h (P1/P2)

---

## 6. Environment ↔ Branch Mapping

| Environment | Git Branch | Host | Database |
|-------------|------------|------|----------|
| Production | `main` | Vercel prod / alternate | Neon production |
| Staging | `staging` | Vercel preview project | Neon staging branch |
| Preview | PR branches | Vercel preview URLs | CI Postgres / dev Neon |
| Local | any | `localhost:9002` | `.env` DATABASE_URL |

---

## 7. Enterprise Roadmap Branch Plan

| Phase | Suggested Branch | Merge Target |
|-------|------------------|--------------|
| 0 — Baseline | `feat/phase0-baseline-governance` | `main` |
| 1 — CI/CD | `feat/phase1-eslint-ci` | `main` |
| 2 — Security | `feat/phase2-rbac-guards` | `main` |
| 3 — Compliance | `feat/phase3-privacy-gdpr` | `main` |
| 4 — Observability | `feat/phase4-health-metrics` | `main` |
| 5–9 | One branch per phase or per epic | `main` |

**Rule:** Do not start Phase N+1 branch until Phase N exit criteria pass on `main`.

---

## 8. Branch Protection Checklist (GitHub Settings)

Configure at **Settings → Branches → Branch protection rules**:

- [ ] Require pull request before merging (`main`)
- [ ] Require status checks: `Lint, typecheck, tests & coverage`, `Production build`, `Playwright E2E`, `Analyze (javascript)` (CodeQL)
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings
- [ ] Phase 1+: add `lint` and `build` required checks
- [ ] Create `staging` branch + protection (Phase 8) — see `docs/STAGING_ENVIRONMENT.md`
- [ ] Configure GitHub `production` environment with required reviewers — see `docs/PROMOTION_WORKFLOW.md`

---

*© 2026 Inievo Technologies — Internal Git Workflow*
