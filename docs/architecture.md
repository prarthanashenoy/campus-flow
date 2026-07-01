# CampusFlow Architecture

## System Overview

CampusFlow is a full-stack web application with a React SPA frontend, a NestJS REST API backend, and a PostgreSQL database. In production it runs on AWS with a CloudFront CDN serving the frontend and ECS Fargate hosting the backend.

## Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
└──────────┬──────────────────────────┬───────────────────┘
           │ Static assets            │ API calls
           ▼                          ▼
┌──────────────────┐       ┌──────────────────────┐
│   CloudFront     │       │   ALB (HTTPS)        │
│   + S3           │       └──────────┬───────────┘
│  (React/Vite)    │                  │
└──────────────────┘       ┌──────────▼───────────┐
                           │  ECS Fargate          │
                           │  NestJS backend       │
                           └──────┬───────┬────────┘
                                  │       │
                     ┌────────────▼┐    ┌─▼──────────────┐
                     │  RDS        │    │  Secrets Manager│
                     │  PostgreSQL │    │  (DATABASE_URL) │
                     └─────────────┘    └────────────────┘

External services
  ├─ Auth0  (JWT issuance, JWKS key rotation)
  └─ Oso Cloud  (authorization policy evaluation)
```

## Backend Module Map

```
AppModule
  ├─ LoggerModule (@Global)         AppLogger, HttpLoggerMiddleware
  ├─ MetricsModule (@Global)        MetricsService, /metrics endpoint
  ├─ PrismaModule (@Global)         PrismaService
  ├─ AuthorizationModule (@Global)  AuthorizationService
  ├─ AuthModule                     JwtStrategy, JwtAuthGuard (APP_GUARD)
  ├─ ThrottlerModule                ThrottlerGuard (APP_GUARD)
  ├─ HealthModule                   GET /api/health (@Public)
  ├─ UsersModule                    GET /api/me
  ├─ OpportunitiesModule            GET/POST/PATCH/DELETE /api/opportunities
  └─ RegistrationsModule            POST /api/opportunities/:id/register
                                    GET  /api/me/registrations
```

## Request Lifecycle

Every authenticated request passes through these layers in order:

```
1. HttpLoggerMiddleware   Assign correlationId (UUID or from x-correlation-id header)
                          Log http.request event
2. ThrottlerGuard         Enforce 10 req/s and 100 req/min per IP
3. JwtAuthGuard           Verify RS256 JWT against Auth0 JWKS
                          Skip if route is @Public()
4. ValidationPipe         Whitelist DTO fields, coerce types, reject unknown properties
5. Controller             Extract params, delegate to Service
6. Service                Business logic
7. AuthorizationService   Oso Cloud check (or DB ownership fallback)
8. PrismaService          Database query
9. HttpLoggerMiddleware   Log http.response with statusCode and durationMs
   MetricsService         Record http_requests_total and http_request_duration_seconds
```

## Data Model

```
User
  id          cuid (PK)
  auth0Id     unique — maps to Auth0 sub claim
  email       unique
  name
  role        STUDENT | ORGANIZER
  opportunities  → Opportunity[]
  registrations  → Registration[]

Opportunity
  id          cuid (PK)
  title, description, category, location
  startDate, endDate?
  capacity?
  isPublished boolean (default true)
  organizerId → User
  registrations → Registration[]

Registration
  id          cuid (PK)
  userId      → User
  opportunityId → Opportunity
  @@unique([userId, opportunityId])   — enforced at DB and application level
```

## Authorization Model

Two-layer defence:

| Layer | Mechanism | When active |
|---|---|---|
| Primary | Oso Cloud (remote policy check) | `OSO_CLOUD_API_KEY` is set |
| Fallback | DB ownership check in service | `OSO_CLOUD_API_KEY` is unset |

Both layers enforce the same invariant: **identity always comes from the validated JWT, never from the request body**.

See [authorization.md](./authorization.md) for the full Polar policy and role/permission table.

## Identity Flow

```
Auth0 issues JWT
  └─ JwtStrategy validates RS256 signature + iss + aud + exp
       └─ @CurrentUser() extracts { sub, email, name }
            └─ UsersService.findOrCreate() upserts the User row
                 └─ authz.syncUserRole() updates Oso fact
```

User identity is derived exclusively from the verified JWT. There is no endpoint that accepts a userId in the request body.

## API Endpoints

### Public (no token required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Service health |
| GET | `/api/opportunities` | List published opportunities |
| GET | `/api/opportunities/:id` | Get single opportunity |
| GET | `/metrics` | Prometheus scrape endpoint |

### Authenticated — Students

| Method | Path | Description |
|---|---|---|
| GET | `/api/me` | Current user profile |
| POST | `/api/opportunities/:id/register` | Register for an opportunity |
| GET | `/api/me/registrations` | My registrations |

### Authenticated — Organizers

| Method | Path | Description |
|---|---|---|
| GET | `/api/opportunities/mine/list` | My opportunities |
| POST | `/api/opportunities` | Create opportunity |
| PATCH | `/api/opportunities/:id` | Update own opportunity (403 for others) |
| DELETE | `/api/opportunities/:id` | Delete own opportunity (403 for others) |
| GET | `/api/opportunities/:id/registrations` | View registrations (owner only) |

## Observability

| Signal | Implementation | Destination |
|---|---|---|
| Structured logs | `AppLogger` → stdout JSON | Splunk / CloudWatch |
| HTTP traces | `HttpLoggerMiddleware` | correlationId links request + response |
| Metrics | `prom-client` + `@willsoto/nestjs-prometheus` | Prometheus → Grafana |

See [logging.md](./logging.md) and [monitoring.md](./monitoring.md) for details.

## Design Decisions

**Why NestJS?**
Opinionated module/DI system keeps concerns separated cleanly. The `APP_GUARD` pattern makes the security default safe — every route requires auth unless explicitly `@Public()`.

**Why Oso Cloud with a DB fallback?**
Oso Cloud provides a centralized, auditable policy — the Polar file is the single source of truth for authorization. The DB fallback means the app is fully functional without an Oso Cloud account, which is important for local development and testing.

**Why class-validator over Zod?**
NestJS's `ValidationPipe` integrates natively with class-validator decorators on DTO classes, enabling `whitelist: true` (strip unknown fields) and `forbidNonWhitelisted: true` (reject requests with extra fields) at the framework level.

**Why OIDC for CI/CD instead of IAM access keys?**
Long-lived access keys are a credential leak risk. GitHub's OIDC provider allows the Actions runner to assume an IAM role scoped to a specific repo and branch with no stored secrets.

**Why CloudFront OAC over OAI?**
Origin Access Identity is legacy. Origin Access Control is the current AWS recommendation: it signs requests with SigV4 and supports S3 server-side encryption with customer-managed keys.
