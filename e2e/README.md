# End-to-end tests (Playwright)

## Prerequisites

- Node.js 20+
- PostgreSQL database with migrations applied (`DATABASE_URL` and `DIRECT_URL` in `.env.local`)
- `AUTH_SECRET` (≥ 32 characters) in `.env.local`
- Playwright browsers: `npm run test:e2e:install`

The dev server started by Playwright requires a valid database connection (Prisma 7).

## Commands

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests (starts dev server on port 9002) |
| `npm run test:e2e:headed` | Run with visible browser |
| `npm run test:e2e:ui` | Interactive Playwright UI mode |
| `npm run test:e2e:debug` | Debug a failing test |
| `npm run test:e2e:report` | Open the last HTML report |

## Test user

`e2e/global-setup.ts` seeds a verified user before the suite:

- Email: `e2e@chattala.test` (override with `E2E_USER_EMAIL`)
- Password: `E2eSecure123!` (override with `E2E_USER_PASSWORD`)

Login tests are skipped automatically if `DATABASE_URL` is missing.

## CI

GitHub Actions workflow `.github/workflows/e2e.yml` runs on pushes and PRs to `main` with a Postgres service container.
