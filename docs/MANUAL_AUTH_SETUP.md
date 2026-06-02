# 🔐 Manual Authentication Setup Guide

## Overview
The Chattala project is now configured with **Email/Password authentication only**. Google OAuth has been completely removed. All auth flows are manual and email-based.

---

## ✅ Authentication Flows Implemented

### 1. **Sign Up** (Email/Password)
- **Route**: `/` (Auth Container)
- **Component**: `src/components/auth/signup-form.tsx`
- **API**: `POST /api/auth/register`
- **Fields**: 
  - Full Name, Preferred Name, Username
  - Email, Mobile (Bangladesh format)
  - Location (Chittagong Thanas), Date of Birth
  - Password (min 6 characters)
- **Features**:
  - Real-time validation
  - Duplicate email/username checking
  - Email verification required
  - Welcome email sent on signup

### 2. **Sign In** (Email/Password)
- **Route**: `/` (Auth Container)
- **Component**: `src/components/auth/login-form.tsx`
- **API**: Credentials Provider in `src/lib/auth.ts`
- **Features**:
  - Email/password validation
  - Rate limiting (prevents brute force)
  - Forgot password link
  - Automatic redirect to dashboard on success

### 3. **Forgot Password**
- **Route**: `/forgot-password`
- **Component**: `src/app/forgot-password/page.tsx`
- **API**: `POST /api/auth/forgot-password`
- **Features**:
  - Email submission
  - Secure token generation (32-byte hex)
  - Reset link expires in 1 hour
  - Security: Doesn't reveal if email exists

### 4. **Reset Password**
- **Route**: `/reset-password/[token]`
- **Component**: `src/app/reset-password/[token]/page.tsx`
- **API**: `POST /api/auth/reset-password`
- **Features**:
  - Password validation
  - Confirm password match
  - Token verification
  - Bcrypt hashing (via Auth.js)

---

## 📦 Architecture

### Auth Configuration Files
```
src/
├── auth.config.ts              # Edge-compatible config
├── lib/auth.ts                 # Full Auth.js setup with adapters
├── middleware.ts               # Security headers & route protection
└── app/
    ├── api/auth/
    │   ├── register/route.ts   # Sign up endpoint
    │   ├── forgot-password/    # Password reset request
    │   ├── reset-password/     # Token verification & reset
    │   ├── verify-email/       # Email verification
    │   └── [...]nextauth]/     # Auth.js handlers
    ├── page.tsx                # Auth container
    ├── forgot-password/        # Forgot password page
    ├── reset-password/         # Reset password page
    └── dashboard/              # Protected route
```

### Components
```
src/components/auth/
├── auth-container.tsx    # Main auth UI (login/signup toggle)
├── login-form.tsx        # Login form only
├── signup-form.tsx       # Signup form only
└── csrf-token.tsx        # CSRF token component (if needed)
```

---

## 🔒 Security Features

### Implemented
✅ Password hashing (bcryptjs)
✅ CSRF protection (Auth.js built-in)
✅ Rate limiting (IP-based via Upstash Redis)
✅ Content Security Policy headers
✅ Secure HTTP-only cookies
✅ Email verification tokens
✅ Password reset tokens (1-hour expiry)
✅ XSS protection headers
✅ HSTS (HTTP Strict Transport Security)

### Environment Variables Required
```bash
AUTH_SECRET                     # Generate: openssl rand -base64 32
NEXTAUTH_URL                   # https://thechattala.com
SMTP_HOST, SMTP_PORT, etc.    # Email service config
UPSTASH_REDIS_REST_URL         # Rate limiting
UPSTASH_REDIS_REST_TOKEN       # Rate limiting
```

---

## 🚀 User Signup Flow

```
1. User fills signup form → 2. Zod validation → 3. POST /api/auth/register
   ├─ Rate limit check
   ├─ Duplicate email/username check
   ├─ Bcrypt hash password
   ├─ Create user in DB
   ├─ Send verification email
   └─ Success → Auto-login → Dashboard
```

---

## 📋 Checklist for Production

- [ ] Auth Secret configured: `openssl rand -base64 32`
- [ ] NEXTAUTH_URL set to production domain
- [ ] Email service (SMTP) credentials verified
- [ ] Redis/rate limiting configured
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Test all auth flows end-to-end
