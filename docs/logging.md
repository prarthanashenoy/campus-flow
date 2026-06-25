# CampusFlow Structured Logging

CampusFlow emits structured JSON log lines to `stdout`. Every line is a single JSON object — ready for ingestion by Splunk, CloudWatch, or any log aggregator that consumes JSON over stdout.

## Log Format

```json
{
  "timestamp": "2026-08-28T14:32:01.123Z",
  "level": "info",
  "service": "campusflow-backend",
  "event": "opportunity.created",
  "correlationId": "b3a4f1e2-...",
  "userId": "usr_abc123",
  "opportunityId": "opp_xyz789"
}
```

| Field | Type | Description |
|---|---|---|
| `timestamp` | ISO 8601 | UTC time of the log event |
| `level` | `info \| warn \| error` | Severity |
| `service` | string | Always `campusflow-backend` |
| `event` | string | Dot-namespaced event identifier |
| `correlationId` | UUID | Ties all log lines for one HTTP request together |
| Additional fields | varies | Event-specific context (see table below) |

## Correlation ID

Each incoming HTTP request is assigned a `correlationId` (UUID v4) by `HttpLoggerMiddleware`. If the caller supplies an `x-correlation-id` header, that value is reused — useful for end-to-end tracing from the frontend.

The ID is:
- Attached to `req.correlationId`
- Forwarded in the `x-correlation-id` response header
- Included in every log line emitted during that request lifecycle

## Application Events

| Event | Level | Extra fields | When |
|---|---|---|---|
| `http.request` | `info` | `method`, `path` | Every incoming request |
| `http.response` | `info/warn/error` | `method`, `path`, `statusCode`, `durationMs` | Every completed response (warn ≥400, error ≥500) |
| `server.started` | `info` | `port` | Application bootstrap |
| `user.login` | `info` | `userId`, `role` | JWT validated and user upserted |
| `opportunity.created` | `info` | `userId`, `opportunityId` | Opportunity created |
| `opportunity.updated` | `info` | `userId`, `opportunityId` | Opportunity updated |
| `opportunity.deleted` | `info` | `userId`, `opportunityId` | Opportunity deleted |
| `registration.created` | `info` | `userId`, `opportunityId`, `registrationId` | Student registered |

## Implementation

| File | Purpose |
|---|---|
| `src/logger/app-logger.service.ts` | `AppLogger` — structured JSON writer, implements `NestLoggerService` |
| `src/logger/http-logger.middleware.ts` | `HttpLoggerMiddleware` — assigns `correlationId`, logs request/response |
| `src/logger/logger.module.ts` | `@Global()` module — exports `AppLogger` everywhere |

`AppLogger` is registered as the NestJS application logger in `main.ts` via `app.useLogger(logger)`, so all framework-level messages (bootstrap, route registration) also go through the structured logger.

## Splunk / Log Aggregator Query Examples

Find all events for a single request:
```
correlationId="b3a4f1e2-..."
```

All slow responses (>500 ms):
```
event="http.response" durationMs>500
```

All 4xx/5xx responses:
```
event="http.response" statusCode>=400
```

All registrations by a specific user:
```
event="registration.created" userId="usr_abc123"
```
