import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import type { JwtPayload } from '../auth/jwt-payload.interface'

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async register(opportunityId: string, jwtPayload: JwtPayload) {
    // Resolve the user from the validated token — never from request body
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

    return this.prisma.registration.create({
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
