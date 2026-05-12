# Local Development Setup Guide

> **Goal:** Get The Chattala running on your machine in under 30 minutes.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [First Steps After Setup](#first-steps-after-setup)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have the following installed and accounts created:

### Software

| Requirement | Version | Install |
|-------------|---------|---------|
| **Node.js** | `>= 18.x` (LTS recommended) | [nodejs.org](https://nodejs.org) |
| **npm** | `>= 9.x` (bundled with Node) | Comes with Node.js |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com) |

> **Tip:** Run `node -v` and `npm -v` to verify installed versions.

### Accounts & Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **[Neon DB](https://neon.tech)** | PostgreSQL database (serverless) | ✅ Yes |
| **[UploadThing](https://uploadthing.com)** | File/image uploads | ✅ Yes |
| **[Google Cloud Console](https://console.cloud.google.com)** | OAuth (Google sign-in) | ✅ Yes |
| **[Upstash](https://console.upstash.com)** | Redis for rate limiting | ✅ Yes |

> You can skip Google OAuth and Upstash Redis for a minimal local setup — see [Minimal Setup](#minimal-setup).

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/abumdselim/thechattala.git
cd thechattala
```

### 2. Create Your Environment File

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your credentials. See [Environment Variables](#environment-variables) below.

### 3. Install Dependencies

```bash
npm install
```

This automatically runs `prisma generate` via the `postinstall` hook.

### 4. Push the Database Schema

```bash
npx prisma db push
```

> Use `db push` for local development. For production, use `npx prisma migrate deploy`.

### 5. Start the Development Server

```bash
npm run dev
```

### 6. Open the App

Visit **[http://localhost:9002](http://localhost:9002)** in your browser.

---

## Environment Variables

Open `.env.local` and configure these values:

### Required (App won't start without these)

```env
# Neon DB — get both from https://console.neon.tech > Connection Details
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth secret — generate with: openssl rand -base64 32
AUTH_SECRET="your-32-character-secret"
NEXTAUTH_SECRET="your-other-32-character-secret"
NEXTAUTH_URL="http://localhost:9002"
```

> **Important — Two DB URLs:** Neon provides a **pooled** URL (for app queries) and a **direct** URL (for Prisma migrations). Both are needed and serve different purposes.

### Optional (Features degrade gracefully without these)

```env
# Google OAuth
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# File uploads
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."

# Rate limiting (auth endpoints won't be rate-limited without this)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email (password reset emails won't send without this)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="hello@thechattala.com"
```

### Minimal Setup

For a fast start without all services, you only need:

1. A Neon DB (free, 60-second setup)
2. `AUTH_SECRET` (generate locally)
3. `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID` (for profile images)

---

## Database Setup

### Step 1: Create a Neon Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project (name it `thechattala` or anything you like)
3. Go to **Connection Details** → copy the **Pooled** connection string → paste as `DATABASE_URL`
4. Switch to **Direct** connection string → paste as `DIRECT_URL`

### Step 2: Apply the Schema

```bash
# Push schema to your database (dev)
npx prisma db push

# OR use migrations (keeps history)
npx prisma migrate dev --name init
```

### Step 3: Verify the Schema

```bash
# Open Prisma Studio — a visual DB browser
npx prisma studio
```

Visit [http://localhost:5555](http://localhost:5555) to browse your tables.

### Step 4: Seed Admin Data (Optional)

```bash
# Creates a default admin user
npx ts-node prisma/seed-admin.ts
```

> Check `prisma/seed-admin.ts` for the default credentials.

---

## Running the App

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack on port 9002 |
| `npm run build` | Build production bundle |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check |
| `npm run test` | Run all unit + integration tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npx prisma studio` | Open visual database editor |
| `npx prisma migrate dev` | Apply schema migrations |

---

## First Steps After Setup

Once the app is running, try these to verify everything works:

### 1. Register a Test User

1. Go to [http://localhost:9002/auth/signup](http://localhost:9002/auth/signup)
2. Fill in name, email, username, and password
3. Submit — you should be redirected to `/dashboard`

### 2. Create a Post

1. Navigate to the **Community** tab in the dashboard
2. Click **Create Post**
3. Write some content and submit
4. Your post should appear in the community feed

### 3. Test Google Sign-In (if configured)

1. Go to [http://localhost:9002/auth/signin](http://localhost:9002/auth/signin)
2. Click **Continue with Google**
3. Complete the OAuth flow

### 4. Test Email Verification (if SMTP configured)

1. Register with a real email address
2. Check your inbox for a verification email
3. Click the link to verify your account

### 5. Access Admin Panel (after seeding admin)

1. Sign in with the seeded admin credentials
2. Go to [http://localhost:9002/admin](http://localhost:9002/admin)
3. You should see the admin dashboard

---

## Useful Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Reset the database completely (⚠️ deletes all data)
npx prisma db push --force-reset

# View database in browser
npx prisma studio

# Check for TypeScript errors
npm run typecheck

# Run specific test file
npx vitest run src/__tests__/api/auth.test.ts

# View Sentry issues (if configured)
# https://sentry.io/organizations/your-org/issues/
```

---

## Troubleshooting

### Port 9002 Already in Use

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:9002
```

**Fix:** Kill the process using that port:

```bash
# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :9002
kill -9 <PID>
```

Or change the port in `package.json`:

```json
"dev": "next dev --turbopack -p 3000"
```

---

### Database Connection Refused

```
Error: Can't reach database server at `ep-xxx.neon.tech`
```

**Checklist:**
- [ ] `DATABASE_URL` is set in `.env.local` (not `.env`)
- [ ] You copied the correct **Pooled** string from Neon
- [ ] The Neon project is not suspended (free tier suspends after inactivity — just visit the Neon console to wake it)
- [ ] `?sslmode=require` is at the end of the URL
- [ ] You're not on a network that blocks outbound PostgreSQL (port 5432)

---

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Fix:**

```bash
npx prisma generate
```

This should run automatically via `postinstall`, but if you skipped `npm install`, run it manually.

---

### Missing Environment Variables

```
Error: AUTH_SECRET is not set
```

**Checklist:**
- [ ] File is named `.env.local` (not `.env`, not `.env.local.txt`)
- [ ] File is in the **project root** (same level as `package.json`)
- [ ] No quotes around values unless required
- [ ] Restart the dev server after editing `.env.local` (`Ctrl+C` → `npm run dev`)

---

### Google OAuth Callback Error

```
Error: redirect_uri_mismatch
```

**Fix:** Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client → add to **Authorized redirect URIs**:

```
http://localhost:9002/api/auth/callback/google
```

---

### UploadThing Upload Fails

**Checklist:**
- [ ] `UPLOADTHING_SECRET` starts with `sk_live_`
- [ ] `UPLOADTHING_APP_ID` matches your app in [uploadthing.com/dashboard](https://uploadthing.com/dashboard)
- [ ] File size is within UploadThing limits (default: 4MB images)

---

*Still stuck? Open an issue on [GitHub](https://github.com/abumdselim/thechattala/issues) or contact the maintainer.*
