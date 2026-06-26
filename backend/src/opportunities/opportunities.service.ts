import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuthorizationService } from '../authorization/authorization.service'
import { AppLogger } from '../logger/app-logger.service'
import { MetricsService } from '../metrics/metrics.service'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/create-opportunity.dto'

export { CreateOpportunityDto, UpdateOpportunityDto }

const OPPORTUNITY_INCLUDE = {
  organizer: { select: { id: true, name: true, email: true } },
  _count: { select: { registrations: true } },
} as const

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly authz: AuthorizationService,
    private readonly logger: AppLogger,
    private readonly metrics: MetricsService,
  ) {}

  findAll() {
    return this.prisma.opportunity.findMany({
      where: { isPublished: true },
      include: OPPORTUNITY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: OPPORTUNITY_INCLUDE,
    })

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id ${id} not found`)
    }

    return opportunity
  }

  // ── Organizer operations ────────────────────────────────────

  async findMyOpportunities(jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)
    return this.prisma.opportunity.findMany({
      where: { organizerId: user.id },
      include: OPPORTUNITY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(dto: CreateOpportunityDto, jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)

    // Oso: check the user has the organizer role (globally)
    if (this.authz.isEnabled()) {
      await this.authz.authorize(user.id, 'create', 'Opportunity', 'global')
    }

    const opportunity = await this.prisma.opportunity.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        organizerId: user.id,
      },
      include: OPPORTUNITY_INCLUDE,
    })

    // Sync ownership fact to Oso Cloud so future checks work
    await this.authz.grantOpportunityOwner(user.id, opportunity.id)

    this.logger.info('opportunity.created', {
      userId: user.id,
      opportunityId: opportunity.id,
    })
    this.metrics.incrementOpportunitiesCreated()

    return opportunity
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
    jwtPayload: JwtPayload,
  ) {
    const user = await this.users.findOrCreate(jwtPayload)

    if (this.authz.isEnabled()) {
      // Oso is the authority: checks ownership fact
      await this.authz.authorize(user.id, 'update', 'Opportunity', id)
    } else {
      // Fallback: DB-level ownership check
      await this.assertOwnership(id, user.id)
    }

    const { startDate, endDate, ...rest } = dto

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate !== undefined
          ? { endDate: endDate ? new Date(endDate) : null }
          : {}),
      },
      include: OPPORTUNITY_INCLUDE,
    })

    this.logger.info('opportunity.updated', { userId: user.id, opportunityId: id })

    return updated
  }

  async remove(id: string, jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)

    if (this.authz.isEnabled()) {
      await this.authz.authorize(user.id, 'delete', 'Opportunity', id)
    } else {
      await this.assertOwnership(id, user.id)
    }

    await this.prisma.opportunity.delete({ where: { id } })

    // Clean up the ownership fact in Oso Cloud
    await this.authz.revokeOpportunityOwner(user.id, id)

    this.logger.info('opportunity.deleted', { userId: user.id, opportunityId: id })
  }

  async findRegistrations(id: string, jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)

    if (this.authz.isEnabled()) {
      await this.authz.authorize(user.id, 'read_registrations', 'Opportunity', id)
    } else {
      await this.assertOwnership(id, user.id)
    }

    return this.prisma.registration.findMany({
      where: { opportunityId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  // ── Private helpers ─────────────────────────────────────────

  /**
   * DB-level ownership fallback used when Oso Cloud is not configured.
   * Ownership is checked against the database record — the user's identity
   * comes exclusively from the validated JWT.
   */
  private async assertOwnership(opportunityId: string, userId: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { organizerId: true },
    })

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id ${opportunityId} not found`)
    }

    if (opportunity.organizerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this opportunity',
      )
    }
  }
}
