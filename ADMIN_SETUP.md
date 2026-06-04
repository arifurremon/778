# Admin setup guide

## Credentials

Set admin seed credentials via environment variables only — never commit real passwords:

```bash
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="use-a-strong-random-password"
```

Generate a password: `openssl rand -base64 24`

## Setup steps

### 1. Create `.env.local`

```bash
cp .env.example .env.local
```

Fill in all values from `.env.example` using your secret manager or service dashboards.

### 2. Set admin variables in `.env.local`

```bash
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-strong-password"
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
```

### 4. Seed the admin user

```bash
npx tsx prisma/seed-admin.ts
```

Expected output includes confirmation that the admin user was created or updated.

### 5. Sign in

Open `/login` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Security notes

- Rotate `ADMIN_PASSWORD` after first login if it was shared during setup.
- Grant `role` of `ADMIN` or `SUPERADMIN` only to trusted accounts (see `npx tsx prisma/seed-admin.ts`).
- Admin API routes use live DB `role` checks via `requireAdmin()` — JWT role is not trusted alone.
