import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common'

export interface LogFields {
  correlationId?: string
  userId?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  service: string
  event: string
  correlationId?: string
  userId?: string
  durationMs?: number
  [key: string]: unknown
}

/**
 * Structured JSON logger — Splunk-compatible.
 * Every log line is a single JSON object written to stdout.
 */
@Injectable()
export class AppLogger implements NestLoggerService {
  private readonly service = 'campusflow-backend'

  private write(level: LogEntry['level'], event: string, fields: LogFields = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      event,
      ...fields,
    }
    process.stdout.write(JSON.stringify(entry) + '\n')
  }

  info(event: string, fields?: LogFields) {
    this.write('info', event, fields)
  }

  warn(event: string, fields?: LogFields) {
    this.write('warn', event, fields)
  }

  error(event: string, fields?: LogFields) {
    this.write('error', event, fields)
  }

  // ── NestLoggerService interface (used as app logger) ─────────

  log(message: string, context?: string) {
    this.write('info', message, context ? { context } : {})
  }

  verbose(message: string, context?: string) {
    // suppress verbose framework noise in production
    if (process.env.NODE_ENV !== 'production') {
      this.write('info', message, context ? { context } : {})
    }
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.write('info', message, context ? { context } : {})
    }
  }
}
