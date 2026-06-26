import { Global, Module } from '@nestjs/common'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { MetricsService } from './metrics.service'
import { MetricsController } from './metrics.controller'
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  opportunitiesCreatedTotal,
  registrationsCreatedTotal,
} from './metrics.service'

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      controller: MetricsController,
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    MetricsService,
    httpRequestsTotal,
    httpRequestDurationSeconds,
    opportunitiesCreatedTotal,
    registrationsCreatedTotal,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
