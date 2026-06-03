# GitHub Project Board Setup — Enterprise Roadmap

> **Purpose:** Track Phases 0–9 of the Enterprise Grade Roadmap  
> **Created:** Phase 0 (2026-03-12)  
> **Owner:** Engineering Lead — Inievo Technologies

---

## 1. Create the Project

1. Go to the repository on GitHub → **Projects** tab
2. Click **New project** → choose **Board** template
3. Name: **`The Chattala — Enterprise Roadmap`**
4. Description: *Track 9-phase upgrade from 2.5/5 to 5/5 enterprise grade*
5. Set visibility: **Private** (internal team)

---

## 2. Recommended Columns

| Column | Purpose |
|--------|---------|
| **Backlog** | All future phase tasks |
| **Phase 0 — Baseline** | Current phase work |
| **Phase 1 — CI/CD** | Next up after Phase 0 exit |
| **Phase 2 — Security** | |
| **Phase 3 — Compliance** | |
| **Phase 4 — Observability** | |
| **Phase 5 — Data** | |
| **Phase 6 — API Platform** | |
| **Phase 7 — Scalability** | |
| **Phase 8 — Enterprise Ops** | |
| **Phase 9 — Validation** | |
| **In Review** | PR open, awaiting merge |
| **Done** | Merged to `main`, exit criteria met |

> **Tip:** GitHub Projects v2 supports custom fields. Add a **Phase** single-select field (0–9) instead of many columns if you prefer a table view.

---

## 3. Labels to Create

Navigate to **Issues → Labels → New label**:

### Priority Labels

| Label | Color | Description |
|-------|-------|-------------|
| `P0-critical` | `#B60205` (red) | Blocks launch or security incident |
| `P1-high` | `#D93F0B` (orange) | Required for current phase exit |
| `P2-medium` | `#FBCA04` (yellow) | Should fix this phase or next |
| `P2-low` | `#0E8A16` (green) | Nice to have / deferrable |

### Phase Labels

| Label | Color |
|-------|-------|
| `phase-0` | `#C5DEF5` |
| `phase-1` | `#BFD4F2` |
| `phase-2` | `#BFDADC` |
| `phase-3` | `#C2E0C6` |
| `phase-4` | `#FEF2C0` |
| `phase-5` | `#F9D0C4` |
| `phase-6` | `#E99695` |
| `phase-7` | `#D4C5F9` |
| `phase-8` | `#C2CAFC` |
| `phase-9` | `#1D76DB` |

### Type Labels

| Label | Use |
|-------|-----|
| `type:security` | Auth, RBAC, CSP, MFA |
| `type:compliance` | Privacy, GDPR, retention |
| `type:infra` | CI/CD, hosting, DR |
| `type:docs` | Architecture, runbooks |
| `type:testing` | Unit, E2E, coverage |
| `type:tech-debt` | SCHEMA-FALLBACK, dead code |

---

## 4. Import Roadmap Tasks as Issues

Create one GitHub Issue per roadmap task. Example for Phase 1:

| Issue Title | Labels | Source |
|-------------|--------|--------|
| Add ESLint config and CI gate | `phase-1`, `P1-high`, `type:infra` | ENTERPRISE_ROADMAP §1.1–1.2 |
| Add build step to CI | `phase-1`, `P1-high`, `type:infra` | §1.3 |
| Coverage threshold ≥ 70% API routes | `phase-1`, `P1-high`, `type:testing` | §1.4 |
| Enable Dependabot | `phase-1`, `P2-medium`, `type:infra` | §1.7 |
| Husky + lint-staged pre-commit | `phase-1`, `P2-medium`, `type:infra` | §1.8 |

**Bulk import option:** Copy tasks from `docs/ENTERPRISE_ROADMAP.md` into issues manually, or use GitHub CLI:

```bash
gh issue create \
  --title "Phase 1.1: Add ESLint config" \
  --label "phase-1,P1-high,type:infra" \
  --body "Source: docs/ENTERPRISE_ROADMAP.md Phase 1, task 1.1"
```

---

## 5. Link Issues to Project

1. Open the project board
2. Click **+ Add item** → search issues by label (e.g. `phase-1`)
3. Drag items to the appropriate column
4. Set **Status** field: Todo / In Progress / Done

---

## 6. Milestones

Create GitHub Milestones matching roadmap milestones:

| Milestone | Target | Phases |
|-----------|--------|--------|
| M0 — Baseline | Week 1 | Phase 0 |
| M1 — Production Hardened | Weeks 2–6 | Phase 1–2 |
| M2 — Enterprise Core | Weeks 7–14 | Phase 3–5 |
| M3 — Enterprise Platform | Weeks 15–20 | Phase 6–7 |
| M4 — Enterprise Grade | Weeks 21–26 | Phase 8–9 |

Assign issues to milestones when creating them.

---

## 7. Weekly Ritual

| Day | Action |
|-----|--------|
| **Monday** | Review board; move 3–5 items to In Progress for current phase |
| **Friday** | Close Done items; verify exit criteria checklist in `ENTERPRISE_ROADMAP.md` |
| **Phase complete** | Tag release; update `BASELINE_AUDIT.md` scores |

---

## 8. Automation (Optional — Phase 1+)

Add `.github/workflows/project-automation.yml` to:
- Auto-add new issues with `phase-*` labels to the project
- Move to **Done** when linked PR merges (GitHub Projects built-in automation)

GitHub → Project → **⚙️ Workflow** → enable:
- *Item added to project*
- *Pull request merged* → set status Done

---

## 9. Current Status (Phase 0)

| Task | Issue | Status |
|------|-------|--------|
| 0.1 Baseline audit | — | ✅ Complete (`docs/BASELINE_AUDIT.md`) |
| 0.2 Launch readiness report | — | ✅ Complete |
| 0.3 Architecture doc | — | ✅ Complete |
| 0.4 RBAC matrix | — | ✅ Draft v0.1 |
| 0.5 Project board | — | 📋 This guide |
| 0.6 Branch strategy | — | ✅ Complete |

**Next:** Create GitHub Project + import Phase 1 issues before starting ESLint work.

---

*© 2026 Inievo Technologies — Internal Project Management Guide*
