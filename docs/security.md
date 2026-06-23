# CampusFlow Security Model

## Layers of Defence

```
Internet
  └─ CORS (origin allowlist)
       └─ Helmet (security headers)
            └─ ThrottlerGuard (rate limiting)
                 └─ JwtAuthGuard (authentication)
                      └─ AuthorizationService (authorization)
                           └─ ValidationPipe (input validation)
                                └─ Handler
```

## Security Headers — Helmet

`helmet` is applied globally in `main.ts`. It sets the following headers on every response:

| Header | Effect |
|---|---|
| `Content-Security-Policy` | Restricts resource loading |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking |
| `Strict-Transport-Security` | Enforces HTTPS |
| `X-XSS-Protection: 0` | Disables legacy XSS filter (CSP is preferred) |

## CORS

Only the frontend origin is permitted to make cross-origin requests.

- Default (development): `http://localhost:5173`
- Production: set `CORS_ORIGIN` in the environment (comma-separated list if multiple)

Allowed methods: `GET POST PATCH DELETE OPTIONS`
Allowed headers: `Content-Type Authorization`
Credentials: enabled (required for Auth0 session cookies)

## Rate Limiting — ThrottlerGuard

Two overlapping windows protect every endpoint:

| Window | Limit | Purpose |
|---|---|---|
| `short` (1 s) | 10 req/IP | Burst protection |
| `medium` (60 s) | 100 req/IP | Sustained abuse protection |

Exceeding either limit returns `429 Too Many Requests`.

## Authentication — JwtAuthGuard

All routes are protected by default. Routes must be explicitly annotated with `@Public()` to skip auth.

- Token format: `Authorization: Bearer <JWT>`
- Algorithm: RS256 (asymmetric)
- Key source: Auth0 JWKS endpoint (`https://<AUTH0_DOMAIN>/.well-known/jwks.json`)
- Claims validated: `iss`, `aud`, `exp`

Public endpoints:
- `GET /api/health`
- `GET /api/opportunities`
- `GET /api/opportunities/:id`

## Authorization — AuthorizationService

See [authorization.md](./authorization.md) for the full model.

## Input Validation — ValidationPipe

The global `ValidationPipe` (configured in `main.ts`) enforces:

- **`whitelist: true`** — strips any properties not declared in the DTO
- **`forbidNonWhitelisted: true`** — returns `400` if unknown properties are present
- **`transform: true`** — coerces primitive types (e.g. string `"5"` → number `5`)

### Validated DTOs

**`CreateOpportunityDto`**

| Field | Rules |
|---|---|
| `title` | string, non-empty, max 200 chars |
| `description` | string, non-empty, max 5000 chars |
| `category` | one of `INTERNSHIP \| RESEARCH \| VOLUNTEER \| EVENT \| WORKSHOP \| OTHER` |
| `location` | string, non-empty, max 300 chars |
| `startDate` | ISO 8601 date string |
| `endDate` | ISO 8601 date string (optional) |
| `capacity` | integer 1–10000 (optional) |

**`UpdateOpportunityDto`** — all fields from `CreateOpportunityDto` are optional, plus:

| Field | Rules |
|---|---|
| `isPublished` | boolean (optional) |

## Identity Guarantee

User identity is **always** sourced from the validated JWT — never from the request body. The `@CurrentUser()` decorator reads `request.user`, which is set by Passport after successful token verification.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH0_DOMAIN` | Yes | JWKS endpoint host |
| `AUTH0_AUDIENCE` | Yes | JWT `aud` claim validation |
| `CORS_ORIGIN` | Prod | Allowed frontend origin(s) |
| `OSO_CLOUD_API_KEY` | No | Enables Oso Cloud; omit to fall back to DB checks |
