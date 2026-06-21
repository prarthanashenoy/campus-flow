import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { Category } from '@prisma/client'

export interface CreateOpportunityDto {
  title: string
  description: string
  category: Category
  location: string
  startDate: string
  endDate?: string | null
  capacity?: number | null
}

export type UpdateOpportunityDto = Partial<CreateOpportunityDto> & {
  isPublished?: boolean
}

const OPPORTUNITY_INCLUDE = {
  organizer: { select: { id: true, name: true, email: true } },
  _count: { select: { registrations: true } },
} as const

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
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
    return this.prisma.opportunity.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        organizerId: user.id,
      },
      include: OPPORTUNITY_INCLUDE,
    })
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
    jwtPayload: JwtPayload,
  ) {
    await this.assertOwnership(id, jwtPayload)

    const { startDate, endDate, ...rest } = dto

    return this.prisma.opportunity.update({
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
  }

  async remove(id: string, jwtPayload: JwtPayload) {
    await this.assertOwnership(id, jwtPayload)
    await this.prisma.opportunity.delete({ where: { id } })
  }

  async findRegistrations(id: string, jwtPayload: JwtPayload) {
    await this.assertOwnership(id, jwtPayload)

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
   * Verify the requesting user owns the opportunity.
   * Ownership is checked against the database record — the opportunityId
   * comes from the URL parameter, but the identity comes from the JWT.
   * An organizer cannot escalate access by guessing another ID.
   */
  private async assertOwnership(id: string, jwtPayload: JwtPayload) {
    const user = await this.users.findOrCreate(jwtPayload)
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      select: { organizerId: true },
    })

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id ${id} not found`)
    }

    if (opportunity.organizerId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this opportunity',
      )
    }
  }
}
