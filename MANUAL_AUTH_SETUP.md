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
1. User fills signup form (name, email, password, etc.)
   ↓
2. Client validates with Zod schema
   ↓
3. POST /api/auth/register
   ├─ Rate limit check (Redis)
   ├─ Email duplicate check
   ├─ Username duplicate check
   ├─ Input sanitization
   ├─ Password hashing (bcryptjs)
   ├─ User created in DB
   ├─ Email verification token generated
   ├─ Verification email sent
   └─ Success response
   ↓
4. Redirect to dashboard (auto-login via credentials provider)
   ↓
5. User receives verification email
   ↓
6. Click email link → /api/auth/verify-email/[token]
   ├─ Token validated
   ├─ Email marked as verified
   └─ User can now access all features
```

---

## 🔑 User Login Flow

```
1. User enters email + password
   ↓
2. Client validates with Zod schema
   ↓
3. CredentialsProvider.authorize() is called
   ├─ Rate limit check (Redis)
   ├─ User lookup by email
   ├─ Password comparison (bcryptjs)
   ├─ User data extracted (id, email, name, etc.)
   └─ Token created (JWT strategy)
   ↓
4. Auth.js sets session cookie (httpOnly, secure)
   ↓
5. Redirect to dashboard
```

---

## 🔄 Password Reset Flow

```
1. User clicks "Forgot Password" on login page
   ↓
2. Enters email → POST /api/auth/forgot-password
   ├─ User lookup by email
   ├─ Reset token generated (32-byte hex)
   ├─ Token stored with 1-hour expiry
   ├─ Email sent with reset link
   └─ Success (doesn't reveal if email exists)
   ↓
3. User receives email with link:
   https://thechattala.com/reset-password/[token]
   ↓
4. User enters new password → POST /api/auth/reset-password
   ├─ Token validation (must be valid + not expired)
   ├─ Password hashing
   ├─ User password updated
   ├─ Reset token cleared
   └─ Success
   ↓
5. Redirect to login page
   ↓
6. User logs in with new password
```

---

## 🧪 Testing Authentication

### Manual Testing
```bash
# 1. Go to homepage
http://localhost:9002

# 2. Try sign up with new account
# 3. Check console/server logs for verification email
# 4. Try sign in with credentials
# 5. Try forgot password flow
# 6. Verify middleware redirects protect routes
```

### API Testing (curl)
```bash
# Register
curl -X POST http://localhost:9002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "username": "testuser"
  }'

# Forgot Password
curl -X POST http://localhost:9002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset Password
curl -X POST http://localhost:9002/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN", "password": "newpassword123"}'
```

---

## ⚙️ Configuration

### Session Strategy
- **Type**: JWT (not database-backed)
- **Why**: Edge-compatible, faster, stateless
- **Storage**: Secure HTTP-only cookies

### Rate Limiting
- **Sign in**: 5 attempts per 15 minutes per IP
- **Register**: 3 attempts per hour per IP
- **Backend**: Upstash Redis (serverless)

### Email Templates
Located in: `src/lib/mail.ts`
- **Verification Email**: User must confirm email
- **Welcome Email**: Sent on account creation
- **Password Reset**: 1-hour expiry link

---

## 🔧 Troubleshooting

### Issue: "Missing CSRF token" errors (OLD)
**Resolution**: Already fixed. Removed custom CSRF validation that conflicted with Auth.js.

### Issue: Users can't sign up
**Check**:
- Database connection working
- EMAIL service configured (SMTP)
- Rate limit not hit (check Redis)
- Form validation errors (console)

### Issue: Password reset email not received
**Check**:
- SMTP credentials correct
- Email service quota not exceeded
- Check spam folder
- Verify email address exists in DB

### Issue: "Invalid token" on password reset
**Likely causes**:
- Token expired (1-hour window)
- Token already used
- Token corrupted/invalid format

---

## 📋 Checklist for Production

- [ ] Auth Secret configured: `openssl rand -base64 32`
- [ ] NEXTAUTH_URL set to production domain
- [ ] Email service (SMTP) credentials verified
- [ ] Redis/rate limiting configured
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Test all auth flows end-to-end
- [ ] Monitor error logs for auth failures
- [ ] Set up email delivery monitoring
- [ ] Document support email for password resets
- [ ] Rate limits adjusted for expected traffic

---

## 📞 Support

For authentication issues:
1. Check server logs: `npm run dev`
2. Check Sentry error tracking
3. Verify .env.local configuration
4. Test database connection
5. Verify email service status

**All Google OAuth references have been removed. System is now email/password only.** ✅
