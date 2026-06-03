# API Versioning & Deprecation Policy

> **Effective:** Phase 6 (2026)  
> **Current stable version:** `v1`  
> **Base paths:** `/api/v1/*` (preferred), `/api/*` (legacy)

---

## Versioning model

The Chattala API uses **URL path versioning**. All new integrations should call versioned routes:

| Preferred (v1) | Legacy (deprecated) |
|----------------|---------------------|
| `GET /api/v1/health` | `GET /api/health` |
| `GET /api/v1/shops` | `GET /api/shops` |
| `POST /api/v1/shops` | `POST /api/shops` |
| `GET /api/v1/services` | `GET /api/services` |
| `POST /api/v1/services` | `POST /api/services` |
| `POST /api/v1/orders` | `POST /api/orders` |
| `GET /api/v1/orders` | `GET /api/orders` |
| `POST /api/v1/services/{id}/bookings` | `POST /api/services/{id}/bookings` |
| `GET /api/v1/directory` | `GET /api/directory` |
| `GET /api/v1/emergency` | `GET /api/emergency` |

Versioned routes are thin wrappers around the current handlers and return identical payloads.

---

## Deprecation timeline

1. **Announcement:** Legacy unversioned routes emit response headers:
   - `Deprecation: true`
   - `Sunset: Wed, 31 Dec 2026 00:00:00 GMT`
   - `Link: </api/v1>; rel="successor-version"`

2. **Migration window:** Integrators have until **31 December 2026** to move to `/api/v1/*`.

3. **Removal:** After sunset, unversioned routes may return `410 Gone` or redirect to v1 equivalents (announced 90 days prior in changelog + email to webhook/API-key owners).

---

## Breaking vs non-breaking changes

| Change type | Policy |
|-------------|--------|
| New optional JSON fields | Non-breaking; allowed in v1 |
| New endpoints | Non-breaking; added to OpenAPI |
| New required request fields | Breaking → requires `v2` |
| Removed/renamed fields | Breaking → requires `v2` |
| Auth mechanism change | Breaking → requires `v2` |

Subscribe to webhook event `ping` or monitor `/api/openapi.json` (`info.version`) for spec updates.

---

## Idempotency

Mutation endpoints that create resources accept:

```http
Idempotency-Key: <unique-client-key>
```

Duplicate requests with the same key and body return the original response with:

```http
Idempotent-Replayed: true
```

Supported routes: `POST /api/orders`, `POST /api/services/*/bookings`, `POST /api/shops`, `POST /api/services`.

---

## Rate limit headers

All rate-limited routes return:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1710000000
```

When exceeded: `429 Too Many Requests` + `Retry-After`.

---

## Single source of truth

- **OpenAPI:** `GET /api/openapi.json`
- **Interactive docs:** `/api/docs`
- **Human guide:** `API.md` (generated from OpenAPI; do not edit endpoint tables manually)

---

## Contact

Security or integration questions: see `SECURITY.md` or contact the platform team via the in-app contact form.
