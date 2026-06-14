import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.opportunity.findMany({
      where: { isPublished: true },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { registrations: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { registrations: true } },
      },
    })

    if (!opportunity) {
      throw new NotFoundException(`Opportunity with id ${id} not found`)
    }

    return opportunity
  }
}
