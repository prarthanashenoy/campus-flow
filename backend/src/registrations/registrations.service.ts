import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuthorizationService } from '../authorization/authorization.service'
import { AppLogger } from '../logger/app-logger.service'
import type { JwtPayload } from '../auth/jwt-payload.interface'

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly authz: AuthorizationService,
    private readonly logger: AppLogger,
  ) {}

  async register(opportunityId: string, jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)

    // Verify the opportunity exists and is published
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
    })

    if (!opportunity || !opportunity.isPublished) {
      throw new NotFoundException(
        `Opportunity with id ${opportunityId} not found`,
      )
    }

    // Oso: check student can register (create a Registration)
    // The registration ID is pre-determined as userId:opportunityId
    if (this.authz.isEnabled()) {
      await this.authz.authorize(
        user.id,
        'create',
        'Registration',
        `${user.id}:${opportunityId}`,
      )
    }

    // Application-level duplicate check (DB constraint is the safety net)
    const existing = await this.prisma.registration.findUnique({
      where: {
        userId_opportunityId: { userId: user.id, opportunityId },
      },
    })

    if (existing) {
      throw new ConflictException(
        'You are already registered for this opportunity',
      )
    }

    const registration = await this.prisma.registration.create({
      data: { userId: user.id, opportunityId },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            category: true,
            location: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    // Grant the user ownership of their own registration fact in Oso
    await this.authz.grantRole(
      user.id,
      'owner',
      'Registration',
      registration.id,
    )

    this.logger.info('registration.created', {
      userId: user.id,
      opportunityId,
      registrationId: registration.id,
    })

    return registration
  }

  async findMyRegistrations(jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)

    return this.prisma.registration.findMany({
      where: { userId: user.id },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            category: true,
            location: true,
            startDate: true,
            endDate: true,
            organizer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
