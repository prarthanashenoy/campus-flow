import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'
import * as request from 'supertest'
import { UsersModule } from './users.module'
import { PrismaModule } from '../prisma/prisma.module'
import { PassportModule } from '@nestjs/passport'
import { RegistrationsModule } from '../registrations/registrations.module'
import { AuthorizationModule } from '../authorization/authorization.module'
import { AuthorizationService } from '../authorization/authorization.service'
import { LoggerModule } from '../logger/logger.module'
import { AppLogger } from '../logger/app-logger.service'
import { JwtStrategy } from '../auth/jwt.strategy'
import { mockAuthorizationService } from '../../test/mocks/authorization.mock'
import { mockAppLogger } from '../../test/mocks/logger.mock'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Reflector } from '@nestjs/core'

/**
 * A minimal JWT strategy stub for testing. It always rejects tokens
 * (validate returns null), mimicking what a real strategy does with a
 * bad token, without making any JWKS network requests.
 */
class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: (req: any) => {
        const authHeader: string = req.headers?.authorization ?? ''
        const [, token] = authHeader.split(' ')
        return token ?? null
      },
      secretOrKey: 'test-secret',
    })
  }

  validate(): null {
    return null // always reject
  }
}

/**
 * Integration tests verifying that unauthenticated requests to protected
 * endpoints are rejected with 401, not 500.
 */
describe('Auth guard – unauthenticated requests', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        AuthorizationModule,
        LoggerModule,
        UsersModule,
        RegistrationsModule,
      ],
      providers: [
        TestJwtStrategy,
        {
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new JwtAuthGuard(reflector),
          inject: [Reflector],
        },
      ],
    })
      .overrideProvider(JwtStrategy)
      .useClass(TestJwtStrategy)
      .overrideProvider(AuthorizationService)
      .useValue(mockAuthorizationService)
      .overrideProvider(AppLogger)
      .useValue(mockAppLogger)
      .overrideProvider('PrismaService')
      .useValue({
        user: { upsert: jest.fn(), findUnique: jest.fn() },
        opportunity: { findUnique: jest.fn() },
        registration: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      })
      .compile()

    app = module.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/me without a token returns 401', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401)
  })

  it('GET /api/me with an invalid token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401)
  })

  it('POST /api/opportunities/:id/register without a token returns 401', async () => {
    await request(app.getHttpServer())
      .post('/api/opportunities/some-id/register')
      .expect(401)
  })

  it('GET /api/me/registrations without a token returns 401', async () => {
    await request(app.getHttpServer()).get('/api/me/registrations').expect(401)
  })
})
