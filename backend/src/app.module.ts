import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { AuthorizationModule } from './authorization/authorization.module'
import { UsersModule } from './users/users.module'
import { OpportunitiesModule } from './opportunities/opportunities.module'
import { RegistrationsModule } from './registrations/registrations.module'
import { LoggerModule } from './logger/logger.module'
import { HttpLoggerMiddleware } from './logger/http-logger.middleware'
import { JwtAuthGuard } from './auth/jwt-auth.guard'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule,
    PrismaModule,
    AuthModule,
    AuthorizationModule,
    HealthModule,
    UsersModule,
    OpportunitiesModule,
    RegistrationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*')
  }
}
