# Developer Scripts

One-off utility scripts for local development and debugging. These are **never** imported by the application and should **never** run in production or CI.

All scripts must be run from the **repository root**.

---

## Available Scripts

### `check:db`
```bash
npm run check:db
```
Verifies that `DATABASE_URL` is present in `.env.local` and that the Prisma client can successfully connect to the database. Prints the first 5 users (email + username only) as a connectivity smoke-test.

**When to use:** After changing `DATABASE_URL`, rotating Neon credentials, or debugging a cold-start connection failure locally.

---

### `script:replace-logs`
```bash
npm run script:replace-logs
```
Walks every `.ts` file under `src/app/api/` and:
1. Strips all bare `console.log(...)` calls.
2. Replaces `console.error("[route]", error)` calls with `logErrorToSentry(error, { route })` and auto-inserts the import if missing.

**When to use:** As a one-time cleanup pass after adding Sentry structured logging. Re-run if new `console.*` calls are accidentally introduced during development.

> ⚠️ **Review the diff before committing.** This script performs in-place file mutations via regex — always run `git diff` afterwards.

---

### `script:test-csrf`
```bash
npm run script:test-csrf
```
Standalone smoke-test for the CSRF token generation and validation logic. Generates a token, prints it, and asserts that valid/invalid token checks behave correctly. Exits with console output only — no side effects.

**When to use:** When modifying the CSRF implementation in `src/lib/` to verify the hash logic is intact before running the full test suite.

---

### `script:deploy`
```bash
bash scripts/deploy.sh
```
Creates a new `auth-ui-modernization` git branch, stages all current changes, and commits with a pre-written message. Intended as a one-time convenience script for a specific feature branch.

> ⚠️ **This script is historical.** It was written for a specific one-time branch operation. Do not reuse it blindly — review the branch name and commit message before running.

---

## Adding New Scripts

1. Place the file in this `scripts/` directory.
2. Add a named entry to the `"scripts"` block in `package.json`.
3. Document it in this README with: purpose, usage command, and a "when to use" note.
4. If the script mutates files or has side effects, add a `⚠️ warning` callout.
