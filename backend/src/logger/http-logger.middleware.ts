import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppLogger } from './app-logger.service'
import { MetricsService } from '../metrics/metrics.service'

// Augment Express Request so TypeScript knows about our custom fields
declare global {
  namespace Express {
    interface Request {
      correlationId: string
      startTime: number
    }
  }
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: AppLogger,
    private readonly metrics: MetricsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    req.correlationId = (req.headers['x-correlation-id'] as string) ?? uuidv4()
    req.startTime = Date.now()

    // Forward the correlation ID in the response so clients can trace requests
    res.setHeader('x-correlation-id', req.correlationId)

    this.logger.info('http.request', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
    })

    res.on('finish', () => {
      const durationMs = Date.now() - req.startTime
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'

      this.logger[level]('http.response', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
      })

      this.metrics.recordHttpRequest(req.method, req.path, res.statusCode, durationMs)
    })

    next()
  }
}
