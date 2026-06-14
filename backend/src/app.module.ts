import { Module } from '@nestjs/common'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'
import { OpportunitiesModule } from './opportunities/opportunities.module'

@Module({
  imports: [PrismaModule, HealthModule, OpportunitiesModule],
})
export class AppModule {}
