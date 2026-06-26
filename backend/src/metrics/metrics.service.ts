import { Injectable } from '@nestjs/common'
import {
  InjectMetric,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'

// ── Provider factories (registered in MetricsModule) ─────────────────────────

export const httpRequestsTotal = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})

export const httpRequestDurationSeconds = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
})

export const opportunitiesCreatedTotal = makeCounterProvider({
  name: 'opportunities_created_total',
  help: 'Total number of opportunities created',
})

export const registrationsCreatedTotal = makeCounterProvider({
  name: 'registrations_created_total',
  help: 'Total number of registrations created',
})

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly reqCounter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly reqDuration: Histogram<string>,

    @InjectMetric('opportunities_created_total')
    private readonly oppCounter: Counter<string>,

    @InjectMetric('registrations_created_total')
    private readonly regCounter: Counter<string>,
  ) {}

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ) {
    const labels = { method, route, status_code: String(statusCode) }
    this.reqCounter.inc(labels)
    this.reqDuration.observe(labels, durationMs / 1000)
  }

  incrementOpportunitiesCreated() {
    this.oppCounter.inc()
  }

  incrementRegistrationsCreated() {
    this.regCounter.inc()
  }
}
