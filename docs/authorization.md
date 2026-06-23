# CampusFlow Authorization Model

CampusFlow uses [Oso Cloud](https://www.osohq.com/) for centralized authorization.

## Architecture

Authorization logic lives in one place: `AuthorizationService` (`src/authorization/`). Controllers and services call `authz.authorize(userId, action, resourceType, resourceId)` — they never implement role-checking logic themselves.

```
Request
  └─ Controller
       └─ Service
            └─ AuthorizationService.authorize()
                 └─ Oso Cloud (remote check)
                      ├─ allow → proceed
                      └─ deny  → ForbiddenException (403)
```

## Polar Policy

The policy is in `oso/policy.polar`.

### Roles

| Role | Scope | Granted when |
|---|---|---|
| `student` | Global (`Opportunity{"global"}`) | Every user on first login |
| `organizer` | Global (`Opportunity{"global"}`) | User has `role = ORGANIZER` in DB |
| `owner` | Per-opportunity (`Opportunity{"<id>"}`) | User created the opportunity |
| `owner` | Per-registration (`Registration{"<id>"}`) | User created the registration |

### Permissions

| Action | Resource | Allowed for |
|---|---|---|
| `read` | `Opportunity` | `student`, `owner` |
| `create` | `Opportunity` | `organizer` (global) |
| `update` | `Opportunity` | `owner` |
| `delete` | `Opportunity` | `owner` |
| `read_registrations` | `Opportunity` | `owner` |
| `read` | `Registration` | `owner` |
| `create` | `Registration` | `owner` |
| `delete` | `Registration` | `owner` |

## Demonstrated 403 Scenarios

The following actions produce `403 Forbidden`:

- **Organizer A edits Organizer B's opportunity** — `update` denied (no `owner` fact for that opportunity/user combination).
- **Organizer A deletes Organizer B's opportunity** — `delete` denied.
- **Organizer A reads registrations for Organizer B's opportunity** — `read_registrations` denied.
- **Student tries to delete an opportunity** — `delete` denied (students have no `owner` role on opportunities they didn't create).

These are covered by the tests in `src/authorization/authorization.service.spec.ts` (unit) and `src/opportunities/opportunities.organizer.spec.ts` (integration with DB fallback).

## Fact Lifecycle

```
User logs in
  └─ syncUserRole(userId, role)         → has_role(User, "student"|"organizer", Opportunity{"global"})

Opportunity created
  └─ grantOpportunityOwner(userId, oppId) → has_role(User, "owner", Opportunity{oppId})

Opportunity deleted
  └─ revokeOpportunityOwner(userId, oppId) → removes fact

Registration created
  └─ grantRole(userId, "owner", Registration, regId) → has_role(User, "owner", Registration{regId})
```

## Local Development Without Oso Cloud

Leave `OSO_CLOUD_API_KEY` unset (or empty) in `.env`. `AuthorizationService.isEnabled()` will return `false` and all services fall back to database-level ownership checks — the same security guarantees apply.

## Setup

1. Create an [Oso Cloud](https://cloud.osohq.com/) account.
2. Deploy the policy: `oso-cloud policy oso/policy.polar`
3. Set `OSO_CLOUD_API_KEY` in `backend/.env`.
