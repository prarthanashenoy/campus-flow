import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { OpportunitiesModule } from './opportunities/opportunities.module'
import { RegistrationsModule } from './registrations/registrations.module'
import { JwtAuthGuard } from './auth/jwt-auth.guard'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    UsersModule,
    OpportunitiesModule,
    RegistrationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
