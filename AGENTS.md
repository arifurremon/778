# AGENTS.md

## Cursor Cloud specific instructions

### Product

Single **Next.js 15** app (The Chattala) on **port 9002** (`npm run dev`). Data layer uses **Prisma 7** with the **Neon serverless adapter** (`src/lib/db.ts`). There is no in-repo Docker Compose or local Postgres workflow that satisfies runtime queries without code changes.

### Required configuration

1. Copy `.env.example` → `.env.local` in the repo root.
2. **Neon PostgreSQL** (or any host reachable via the Neon serverless driver): set both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct, for `prisma db push` / migrations).
3. Auth: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL=http://localhost:9002`, `NEXT_PUBLIC_APP_URL=http://localhost:9002`.

`npx prisma db push` can succeed against a local Postgres instance using `DIRECT_URL`, but **API routes and the dev server still require a Neon-compatible `DATABASE_URL`** at runtime (the client uses WebSockets via `@prisma/adapter-neon`). Plain `localhost:5432` URLs will fail on DB access with WebSocket `ECONNREFUSED`.

Optional services (graceful degradation): Upstash Redis, UploadThing, SMTP, Sentry.

See **SETUP.md** for full variable list and troubleshooting.

### Commands (see `package.json`)

| Task | Command |
|------|---------|
| Dev server | `npm run dev` → http://localhost:9002 |
| Lint | `npm run lint` (may prompt for ESLint setup if no config is committed) |
| Typecheck | `npm run typecheck` |
| Validate (CI parity) | `npm run validate` (typecheck + unit tests; set `NEXT_PUBLIC_APP_URL=http://localhost:3000` to match GitHub Actions) |
| Unit + integration tests | `npm run test` or `npm run test:integration` (mocked Prisma; no DB) |
| E2E | `npm run test:e2e` (install browsers once: `npx playwright install chromium`) |
| DB schema | `npx prisma db push` or `npx prisma migrate dev` |
| Admin seed | `npx tsx prisma/seed-admin.ts` (needs working `DATABASE_URL`) |

### Running the dev server (long-lived)

Use a **tmux** session so the process survives backgrounding, e.g. session name `next-dev-server`:

```bash
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s next-dev-server -c /workspace -- bash -lc 'npm run dev'
```

### Auth routes

- Login/signup UI: **`/login`** (not `/auth`; some E2E specs may reference `/auth`).
- Registration API: `POST /api/auth/register` (requires live DB).

### Gotchas

- **Quoted cloud secrets:** If `DATABASE_URL` / `DIRECT_URL` are injected with literal `"` characters around the URL, they override `.env.local` and Prisma fails with `P1013` (invalid scheme). Keep clean URLs in `.env.local`, `unset DATABASE_URL DIRECT_URL` before `npx prisma …`, and start the dev server with `set -a && source .env.local && set +a` so the file wins over the environment.
- Restart `npm run dev` after editing `.env.local`.
- `scripts/check-db.ts` loads `dotenv` after importing `@/lib/db`; prefer verifying DB via an API call or Prisma CLI, not that script alone.
- `npm run build` runs `prisma migrate deploy` and needs valid `DATABASE_URL` / `DIRECT_URL`.
