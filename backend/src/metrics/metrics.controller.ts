import { Controller, Get, Res } from '@nestjs/common'
import { PrometheusController } from '@willsoto/nestjs-prometheus'
import { Public } from '../auth/public.decorator'
import type { Response } from 'express'

/**
 * Wraps the library's PrometheusController to mark the endpoint as public
 * so JwtAuthGuard does not require a bearer token on /metrics.
 */
@Public()
@Controller()
export class MetricsController extends PrometheusController {
  @Public()
  @Get()
  override async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response)
  }
}
