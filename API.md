# API Documentation

> **Base URL (Production):** `https://www.thechattala.com/api`
> **Base URL (Development):** `http://localhost:9002/api`
> **Version:** `v1.0.0`
> **Protocol:** HTTPS (TLS 1.2+)
> **Format:** JSON (`Content-Type: application/json`)

---

## Table of Contents

- [Authentication](#authentication)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Auth](#auth-endpoints)
  - [Posts](#posts-endpoints)
  - [Users](#users-endpoints)
  - [Neighbours](#neighbours-endpoints)
  - [Shops](#shops-endpoints)
  - [Services](#services-endpoints)
  - [Admin](#admin-endpoints)
  - [File Uploads](#file-uploads-endpoints)

---

## Authentication

The Chattala API uses **session-based authentication** via NextAuth.js v5. All protected endpoints require an active session.

### Session Cookies

After sign-in, NextAuth sets an `authjs.session-token` cookie. This is automatically included in all same-origin requests.

### For External Clients / API Testing

When calling from a script or tool like Postman:

```http
Cookie: authjs.session-token=<your-session-token>
```

Retrieve your session token from browser DevTools → Application → Cookies after signing in.

### CSRF Protection

All `POST`, `PATCH`, `DELETE` requests to NextAuth endpoints require a CSRF token.

```javascript
// Get CSRF token first
const csrfRes = await fetch('/api/auth/csrf');
const { csrfToken } = await csrfRes.json();

// Include in form body
body: JSON.stringify({ csrfToken, ...otherData })
```

---

## Error Codes

All errors return a JSON body:

```json
{
  "error": "Human-readable error message"
}
```

| HTTP Code | Meaning | Common Cause |
|-----------|---------|--------------|
| `400` | Bad Request | Validation failed (missing/invalid fields) |
| `401` | Unauthorized | No session or session expired |
| `403` | Forbidden | Valid session, but insufficient permissions (e.g., not admin) |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (email/username already taken) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unhandled server exception |

---

## Rate Limiting

Rate limits are enforced via **Upstash Redis** (`@upstash/ratelimit`). Successful responses include:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1710000000
```

When exceeded, the response is:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710000000
```

```json
{
  "error": "Too many requests. Please wait before trying again."
}
```

| Endpoint Group | Limit | Window | Key |
|---------------|-------|--------|-----|
| `POST /api/auth/register` | 5 | 15 min | IP |
| `POST /api/auth/signin` (credentials) | 10 | 15 min | IP + email |
| `POST /api/auth/forgot-password` | 3 | 15 min | IP + email |
| `POST /api/auth/reset-password` | 5 | 15 min | IP |
| `POST /api/auth/resend-verification` | 3 | 1 hour | IP |
| `POST /api/posts` | 10 | 1 hour | user ID |
| `POST /api/orders` | 5 | 1 hour | user ID |
| `POST /api/messages/**` | 30 | 1 min | user ID |
| `POST /api/posts/*/comments` | 30 | 15 min | user ID |
| `POST /api/posts/*/react` | 60 | 15 min | user ID |
| `POST /api/neighbours/**` | 10–20 | 1 hour | user ID |
| `POST /api/bookings/**` | 10 | 1 hour | user ID |
| `POST /api/shops` (register) | 3 | 1 hour | user ID |
| `POST /api/services` (register) | 3 | 1 hour | user ID |
| `POST /api/contact`, `/suggestions` | 3–5 | 15 min–1 hr | user ID |
| `GET /api/directory`, `/emergency` | 60 | 1 min | IP |
| `POST /api/admin/**` | 60 | 1 min | admin user ID |
| `POST /api/pusher/auth` | 30 | 1 min | user ID |

---

## OpenAPI & Interactive Docs (Phase 6)

> **Single source of truth:** OpenAPI 3.1 spec — do not duplicate endpoint tables manually.

| Resource | URL |
|----------|-----|
| OpenAPI JSON | `GET /api/openapi.json` |
| Interactive docs | `/api/docs` |
| Versioned base path | `/api/v1/*` (preferred) |
| Deprecation policy | `docs/API_DEPRECATION_POLICY.md` |

Legacy unversioned routes (`/api/*`) remain available but return `Deprecation` + `Sunset` headers until **31 Dec 2026**.

---

## Idempotency (Phase 6)

Send on resource-creating `POST` requests:

```http
Idempotency-Key: my-unique-key-12345678
```

Supported routes:

- `POST /api/orders`
- `POST /api/services/{expertId}/bookings`
- `POST /api/shops`
- `POST /api/services`

Duplicate requests with the same key and body return the original response:

```http
Idempotent-Replayed: true
```

Keys expire after 24 hours.

---

## API Keys (Phase 6)

Server-to-server keys for integrations (session required to manage):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/user/api-keys` | List keys (prefix only) |
| `POST` | `/api/user/api-keys` | Create key — raw value shown once |
| `DELETE` | `/api/user/api-keys/{id}` | Revoke key |

Authenticate with:

```http
Authorization: Bearer tc_live_...
```

Scopes: `read:shops`, `read:services`, `read:directory`, `read:orders`, `write:orders`, `read:webhooks`, `write:webhooks`, or `*`.

---

## Webhooks (Phase 6)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/webhooks` | List subscriptions |
| `POST` | `/api/webhooks` | Create subscription (HTTPS URL + events) |
| `DELETE` | `/api/webhooks/{id}` | Deactivate subscription |
| `POST` | `/api/webhooks/test` | Queue `ping` event to your endpoints |

Events: `order.created`, `order.updated`, `booking.created`, `booking.updated`, `shop.registered`, `service.registered`, `ping`.

Deliveries are signed:

```http
X-Webhook-Signature: sha256=<hmac-hex>
X-Webhook-Timestamp: 1710000000
X-Webhook-Event: order.created
```

Failed deliveries retry with exponential backoff; exhausted attempts move to DLQ (`WebhookDelivery.status = DLQ`).

---

## Endpoints

---

## Auth Endpoints

### Register a New User

Creates a new user account with email/password credentials.

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "name": "Abu Md. Selim",
  "email": "selim@thechattala.com",
  "username": "selim",
  "password": "SecurePassword123!"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | 2–100 characters |
| `email` | string | ✅ | Valid email format, unique |
| `username` | string | ✅ | 3–30 chars, alphanumeric + underscore, unique |
| `password` | string | ✅ | Min 6 characters |

**Success Response `201`:**

```json
{
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "clx...",
    "name": "Abu Md. Selim",
    "email": "selim@thechattala.com",
    "username": "selim"
  }
}
```

**Error Responses:**

```json
// 400 — Validation failed
{ "error": "Password must be at least 6 characters" }

// 409 — Email already registered
{ "error": "An account with this email already exists" }

// 409 — Username taken
{ "error": "Username is already taken" }

// 429 — Rate limited
{ "error": "Too many registration attempts. Try again in 15 minutes." }
```

---

### Sign In

Handled by NextAuth. Use the built-in endpoint:

```http
POST /api/auth/callback/credentials
```

**Request Body (form-encoded):**

```
csrfToken=<csrf-token>
email=selim@thechattala.com
password=SecurePassword123!
```

**Success:** Redirects to `/dashboard` and sets session cookie.

---

### Sign Out

```http
POST /api/auth/signout
```

**Request Body:**

```json
{
  "csrfToken": "<csrf-token>"
}
```

**Success:** Clears session cookie, redirects to `/`.

---

### Get Current Session

```http
GET /api/auth/session
```

**Success Response `200`:**

```json
{
  "user": {
    "id": "clx...",
    "name": "Abu Md. Selim",
    "email": "selim@thechattala.com",
    "username": "selim",
    "image": "https://uploadthing-cdn.../avatar.jpg",
    "isAdmin": false
  },
  "expires": "2026-06-12T11:41:34.000Z"
}
```

**No Session `200`:**

```json
null
```

---

### Forgot Password

Sends a password reset email to the provided address.

```http
POST /api/auth/forgot-password
```

**Request Body:**

```json
{
  "email": "selim@thechattala.com"
}
```

**Success Response `200`** (always returns success to prevent email enumeration):

```json
{
  "message": "If that email exists, a reset link has been sent."
}
```

---

### Reset Password

```http
POST /api/auth/reset-password/[token]
```

**URL Parameter:** `token` — the reset token received via email.

**Request Body:**

```json
{
  "password": "NewSecurePassword456!"
}
```

**Success Response `200`:**

```json
{
  "message": "Password reset successfully. You can now sign in."
}
```

**Error Responses:**

```json
// 400 — Token expired or invalid
{ "error": "This reset link is invalid or has expired." }

// 400 — Password too short
{ "error": "Password must be at least 6 characters." }
```

---

### Verify Email

```http
GET /api/auth/verify-email?token=[token]
```

**Query Parameter:** `token` — the verification token sent via email.

**Success Response `200`:**

```json
{
  "message": "Email verified successfully."
}
```

---

## Posts Endpoints

All post endpoints require an active session (`401` if not authenticated).

### Create a Post

```http
POST /api/posts
```

**Request Body:**

```json
{
  "content": "Just spotted a new bakery opening near Chawkbazar! 🥐",
  "imageUrl": "https://uploadthing-cdn.../post-image.jpg"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `content` | string | ✅ | 1–2000 characters |
| `imageUrl` | string | ❌ | Valid URL to an uploaded image |

**Success Response `201`:**

```json
{
  "id": "clx...",
  "content": "Just spotted a new bakery opening near Chawkbazar! 🥐",
  "imageUrl": null,
  "authorId": "clx...",
  "createdAt": "2026-05-12T11:41:34.000Z",
  "author": {
    "name": "Abu Md. Selim",
    "username": "selim",
    "image": "https://..."
  }
}
```

---

### List Posts

```http
GET /api/posts
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Posts per page (max 50) |

**Success Response `200`:**

```json
{
  "posts": [
    {
      "id": "clx...",
      "content": "...",
      "imageUrl": null,
      "createdAt": "2026-05-12T11:41:34.000Z",
      "author": {
        "id": "clx...",
        "name": "Abu Md. Selim",
        "username": "selim",
        "image": "https://..."
      }
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

---

### Update a Post

Only the post author can update their own post.

```http
PATCH /api/posts/[postId]
```

**URL Parameter:** `postId` — the post's unique ID.

**Request Body:**

```json
{
  "content": "Updated content here"
}
```

**Success Response `200`:**

```json
{
  "id": "clx...",
  "content": "Updated content here",
  "updatedAt": "2026-05-12T12:00:00.000Z"
}
```

**Error Responses:**

```json
// 403 — Not the post author
{ "error": "You are not authorized to edit this post." }

// 404 — Post not found
{ "error": "Post not found." }
```

---

### Delete a Post

Only the post author (or an admin) can delete a post.

```http
DELETE /api/posts/[postId]
```

**Success Response `200`:**

```json
{
  "message": "Post deleted successfully."
}
```

---

## Users Endpoints

### Get Current User Profile

```http
GET /api/user/profile
```

**Success Response `200`:**

```json
{
  "id": "clx...",
  "name": "Abu Md. Selim",
  "username": "selim",
  "email": "selim@thechattala.com",
  "image": "https://uploadthing-cdn.../avatar.jpg",
  "bio": "Founder of Inievo Technologies",
  "isAdmin": false,
  "emailVerified": "2026-05-01T00:00:00.000Z",
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

---

### Update Current User Profile

```http
PATCH /api/user/profile
```

**Request Body (all fields optional):**

```json
{
  "name": "Abu Md. Selim",
  "username": "selim_new",
  "bio": "Founder of Inievo Technologies",
  "image": "https://uploadthing-cdn.../new-avatar.jpg"
}
```

**Success Response `200`:**

```json
{
  "message": "Profile updated successfully.",
  "user": {
    "name": "Abu Md. Selim",
    "username": "selim_new",
    "bio": "Founder of Inievo Technologies",
    "image": "https://..."
  }
}
```

**Error Responses:**

```json
// 409 — Username taken
{ "error": "This username is already taken." }
```

---

### Delete Account

Permanently deletes the authenticated user's account and all associated data.

```http
DELETE /api/user/delete-account
```

**Request Body:**

```json
{
  "password": "CurrentPassword123!"
}
```

**Success Response `200`:**

```json
{
  "message": "Account deleted successfully."
}
```

> ⚠️ **This action is irreversible.** All user data, posts, and connections are permanently deleted.

---

## Neighbours Endpoints

### Send Connection Request

```http
POST /api/neighbours/request
```

**Request Body:**

```json
{
  "targetUserId": "clx..."
}
```

---

### Accept / Reject Request

```http
PATCH /api/neighbours/[requestId]
```

**Request Body:**

```json
{
  "action": "ACCEPT"  // or "REJECT"
}
```

---

### Get My Neighbours

```http
GET /api/neighbours
```

Returns all `ACCEPTED` connections for the current user.

---

## Shops Endpoints

### List Shops

```http
GET /api/shops
```

### Get a Shop

```http
GET /api/shops/[shopId]
```

### Create a Shop

```http
POST /api/shops
```

### Update a Shop

```http
PATCH /api/shops/[shopId]
```

---

## Services Endpoints

### List Services

```http
GET /api/services
```

### Get a Service

```http
GET /api/services/[serviceId]
```

### Create a Service

```http
POST /api/services
```

### Update a Service

```http
PATCH /api/services/[serviceId]
```

---

## Admin Endpoints

> All admin endpoints require `isAdmin: true` on the user session. Returns `403` otherwise.

### List All Users

```http
GET /api/admin/users
```

### Get User Details

```http
GET /api/admin/users/[userId]
```

### Update User Status

```http
PATCH /api/admin/users/[userId]
```

**Request Body:**

```json
{
  "isAdmin": true,
  "emailVerified": "2026-05-12T00:00:00.000Z"
}
```

### Delete User (Admin)

```http
DELETE /api/admin/users/[userId]
```

### List All Posts (Admin)

```http
GET /api/admin/posts
```

### Delete Post (Admin)

```http
DELETE /api/admin/posts/[postId]
```

### List All Shops (Admin)

```http
GET /api/admin/shops
```

### Approve/Reject Shop

```http
PATCH /api/admin/shops/[shopId]
```

---

## File Uploads Endpoints

File uploads are handled by **UploadThing**. Use the `@uploadthing/react` client library — do not call these endpoints directly.

```http
POST /api/uploadthing
```

Supported upload types (defined in `src/app/api/uploadthing/core.ts`):

| Type | Max Size | Allowed Formats |
|------|----------|----------------|
| Profile images | 4MB | JPEG, PNG, WebP, GIF |
| Post images | 8MB | JPEG, PNG, WebP |

After upload, the CDN URL is returned and stored in the database. When a profile image is replaced, the old image is **automatically deleted** from UploadThing's CDN via `UTApi.deleteFiles()`.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| `v1.0.0` | 2026-05-12 | Initial API documentation |

---

*This document is maintained alongside the codebase. When adding new API routes, update this file in the same PR.*
