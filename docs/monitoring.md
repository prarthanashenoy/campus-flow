# CampusFlow Monitoring

## Architecture

```
Backend (:4000/metrics)
  └─ Prometheus (:9090)  ← scrapes every 15 s
       └─ Grafana (:3000) ← queries Prometheus
```

## Running Locally

```bash
# Start PostgreSQL + Prometheus + Grafana
docker compose up -d

# Start the backend (metrics are served at /metrics — no auth prefix)
cd backend && npm run start:dev
```

Grafana is available at **http://localhost:3000** (admin / admin).
The **CampusFlow Backend** dashboard is pre-provisioned and loads automatically.

## Metrics Endpoint

`GET /metrics` — plain text Prometheus exposition format. No authentication required (scraped internally by Prometheus, not exposed to end users in production).

## Collected Metrics

### HTTP Metrics (from `HttpLoggerMiddleware`)

| Metric | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Cumulative request count |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Request duration (buckets: 5ms–5s) |

### Business Metrics

| Metric | Type | Description |
|---|---|---|
| `opportunities_created_total` | Counter | Opportunities successfully created |
| `registrations_created_total` | Counter | Student registrations successfully created |

### Node.js Default Metrics (from `prom-client`)

Automatically collected: heap usage, GC duration, event loop lag, active handles, CPU usage, and more.

## Dashboard Panels

The pre-provisioned **CampusFlow Backend** dashboard (`infrastructure/grafana/provisioning/dashboards/campusflow.json`) includes:

| Panel | Query |
|---|---|
| Request Rate | `sum(rate(http_requests_total[1m])) by (method, status_code)` |
| P99 Request Duration | `histogram_quantile(0.99, ...)` |
| Error Rate (5xx/s) | `sum(rate(http_requests_total{status_code=~"5.."}[1m]))` |
| Business Events | `increase(opportunities_created_total[1h])` |
| Stat: Total Opportunities | `opportunities_created_total` |
| Stat: Total Registrations | `registrations_created_total` |
| Stat: Heap Used (MB) | `nodejs_heap_size_used_bytes / 1024 / 1024` |
| Stat: Event Loop Lag (ms) | `nodejs_eventloop_lag_seconds * 1000` |

## Infrastructure Files

| File | Purpose |
|---|---|
| `infrastructure/prometheus/prometheus.yml` | Prometheus scrape config (target: `host.docker.internal:4000`) |
| `infrastructure/grafana/provisioning/datasources/prometheus.yml` | Auto-provisions Prometheus datasource |
| `infrastructure/grafana/provisioning/dashboards/dashboard.yml` | Grafana dashboard provider config |
| `infrastructure/grafana/provisioning/dashboards/campusflow.json` | Dashboard definition |

## Alerting (future)

Recommended alert thresholds:
- P99 latency > 2 s sustained over 5 min
- Error rate (5xx) > 1% over 5 min
- Event loop lag > 100 ms
