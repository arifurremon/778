# Deployment environment variables — analysis notes

**Date:** June 2026  
**Status:** Reference only — **no secrets in this file**

> Use `.env.example` as the template. Store real values in `.env.local` or Vercel environment variables only.

---

## ✅ সঠিক আছে (15/17 Variables)

এই variables গুলো সব সঠিক:

| # | Variable | Status | Verification |
|---|----------|--------|---|
| 1 | `DATABASE_URL` | ✅ | Neon Pooled Connection Valid |
| 2 | `DIRECT_URL` | ✅ | Neon Direct Connection Valid |
| 3 | `AUTH_SECRET` | ✅ | 32+ characters, strong |
| 4 | `NEXTAUTH_SECRET` | ✅ | Valid secret string |
| 5 | `NEXTAUTH_URL` | ✅ | https://thechattala.com |
| 6 | `GOOGLE_CLIENT_ID` | ✅ | Valid format |
| 7 | `GOOGLE_CLIENT_SECRET` | ✅ | Valid format |
| 8 | `SMTP_HOST` | ✅ | Brevo SMTP relay |
| 9 | `SMTP_PORT` | ✅ | 587 (TLS) correct |
| 10 | `SMTP_USER` | ✅ | Valid Brevo account |
| 11 | `SMTP_PASSWORD` | ✅ | Valid API key |
| 12 | `SMTP_FROM` | ✅ | hello@thechattala.com |
| 13 | `UPLOADTHING_SECRET` | ✅ | sk_live_ prefix correct |
| 14 | `UPLOADTHING_APP_ID` | ✅ | d6fpgbi73a |
| 15 | `UPSTASH_REDIS_REST_URL` | ✅ | Valid endpoint |
| 16 | `UPSTASH_REDIS_REST_TOKEN` | ✅ | Valid token |
| 17 | `NEXT_PUBLIC_SENTRY_DSN` | ✅ | Valid DSN |

---

## 🔴 Critical Issues Found

### Issue #1: NODE_ENV Value ⚠️ CRITICAL

**Current Value:**
```bash
NODE_ENV="development"
```

**Problem:** ❌ এটি development এর জন্য। Production এ এটি ক্রাশ করবে!

**Solution:** Change করুন:
```bash
NODE_ENV="production"
```

**Impact:** 
- ❌ Security features disabled (development mode)
- ❌ Cookies not secure (HTTP allowed)
- ❌ Performance optimizations off
- ❌ Error messages expose internals

**MUST FIX BEFORE DEPLOYING!**

---

### Issue #2: Missing Variables (Optional but Recommended)

আপনার কোডে এই variables গুলো optional, কিন্তু production এ থাকলে ভালো:

#### **a) Admin Credentials (Optional)**
```bash
# For Prisma seed-admin.ts
ADMIN_EMAIL="admin@thechattala.com"
ADMIN_PASSWORD="your-strong-admin-password"
```
**কেন:** Admin user create করার সময় লাগবে  
**Impact:** Development কাজ করবে, production এ manually admin create করতে হবে

#### **b) Environment-Specific URLs**

Production এ এটি সুপারিশ করা হয়:
```bash
# আপনার production domain
NEXTAUTH_URL="https://thechattala.com"  # ✅ Already provided

# যদি API server আলাদা থাকে
API_URL="https://api.thechattala.com"
# Frontend URL যদি CDN থাকে
FRONTEND_URL="https://app.thechattala.com"
```

---

## ⚡ Deployment Mode Checklist

### For Production Deployment:

#### **Step 1: Update NODE_ENV** 🔴 CRITICAL
```bash
NODE_ENV="production"
```

#### **Step 2: Verify URLs**
```bash
NEXTAUTH_URL="https://thechattala.com"  ✅ Production URL, no trailing slash
```

#### **Step 3: Verify Database Credentials**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_hOywq5Z4xQAs@ep-rapid-bonus-aonj8ih9-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:npg_hOywq5Z4xQAs@ep-rapid-bonus-aonj8ih9.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```
✅ Same database for both dev & prod (OK if testing), but consider separate DB for prod safety

#### **Step 4: Redis status**

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Upstash console. Required for production rate limiting (fail-closed).

#### **Step 5: Email configuration**

Set `SMTP_*` variables from your Brevo (or other SMTP) dashboard. See `.env.example`.

---

## 🛑 What Could Break in Production?

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| **NODE_ENV=development** | 🔴 CRITICAL | Cookies insecure, performance poor | Change to "production" |
| **Same DB for dev+prod** | 🟠 HIGH | Data loss risk if testing on prod | Use separate DB |
| **Missing ADMIN vars** | 🟡 MEDIUM | Manual admin setup needed | Optional, can set later |
| **No backup strategy** | 🟡 MEDIUM | Data loss if DB crashes | Setup Neon backups |
| **No rate limiting baseline** | 🟢 LOW | Bruteforce possible | Already configured |

---

## Production environment template

Copy `.env.example` to `.env.local` or configure the same keys in Vercel. **Do not paste real secrets into markdown files.**

```bash
cp .env.example .env.local
# Fill values from service dashboards (Neon, Upstash, Brevo, UploadThing, Sentry)
NODE_ENV="production"   # Vercel Production environment only
```

## 🚀 Final Deployment Steps

### Step 1: Fix NODE_ENV
```bash
# Change this line in your .env.production.local or Vercel Settings:
NODE_ENV="production"  # ← FROM "development"
```

### Step 2: Deploy to Vercel
```bash
# 1. Push to GitHub
git add docs/DEPLOYMENT_ENV.md
git commit -m "fix: Set NODE_ENV to production for deployment"
git push origin main

# 2. Go to Vercel Dashboard
# Project Settings → Environment Variables
# Update: NODE_ENV="production"

# 3. Trigger Deploy
vercel deploy --prod
```

### Step 3: Verify Post-Deployment
```bash
✅ App loads without errors
✅ Login works (Google OAuth)
✅ Email verification sends
✅ File upload works
✅ Check Sentry for any errors
```

---

## 📋 Summary

| Total Variables | Valid | Invalid | Missing | Status |
|---|---|---|---|---|
| **17** | ✅ 16 | 🔴 1 | ⚠️ Optional | **⚠️ NEEDS FIX** |

**ACTION REQUIRED:** Change `NODE_ENV` from `"development"` to `"production"` before deploying!

---

**Last Updated:** May 18, 2026  
**Status:** 🔴 Awaiting Critical Fix
