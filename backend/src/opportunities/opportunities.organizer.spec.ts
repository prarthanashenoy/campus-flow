import { Test, TestingModule } from '@nestjs/testing'
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { OpportunitiesController } from './opportunities.controller'
import { OpportunitiesService } from './opportunities.service'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuthorizationService } from '../authorization/authorization.service'
import { AppLogger } from '../logger/app-logger.service'
import { MetricsService } from '../metrics/metrics.service'
import { mockAuthorizationService } from '../../test/mocks/authorization.mock'
import { mockAppLogger } from '../../test/mocks/logger.mock'
import { mockMetricsService } from '../../test/mocks/metrics.mock'
import { Category, Role } from '@prisma/client'
import type { JwtPayload } from '../auth/jwt-payload.interface'

const ownerUser = {
  id: 'user-organizer-1',
  auth0Id: 'auth0|organizer1',
  email: 'alice@uni.edu',
  name: 'Alice',
  role: Role.ORGANIZER,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const otherUser = {
  id: 'user-organizer-2',
  auth0Id: 'auth0|organizer2',
  email: 'bob@uni.edu',
  name: 'Bob',
  role: Role.ORGANIZER,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockOpportunity = {
  id: 'opp-1',
  title: 'Test Opportunity',
  description: 'Description',
  category: Category.RESEARCH,
  location: 'Lab',
  startDate: new Date('2026-09-01'),
  endDate: null,
  capacity: 5,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizerId: 'user-organizer-1',
  organizer: { id: 'user-organizer-1', name: 'Alice', email: 'alice@uni.edu' },
  _count: { registrations: 0 },
}

const ownerJwt: JwtPayload = { sub: 'auth0|organizer1', email: 'alice@uni.edu', name: 'Alice' }
const otherJwt: JwtPayload = { sub: 'auth0|organizer2', email: 'bob@uni.edu', name: 'Bob' }

const mockPrisma = {
  opportunity: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  registration: { findMany: jest.fn() },
  user: { upsert: jest.fn(), findUnique: jest.fn() },
}

describe('OpportunitiesController – organizer operations', () => {
  let controller: OpportunitiesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpportunitiesController],
      providers: [
        OpportunitiesService,
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthorizationService, useValue: mockAuthorizationService },
        { provide: AppLogger, useValue: mockAppLogger },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile()

    controller = module.get<OpportunitiesController>(OpportunitiesController)
  })

  afterEach(() => jest.clearAllMocks())

  // ── Create ──────────────────────────────────────────────────

  describe('POST /opportunities', () => {
    it('creates an opportunity and assigns the organizer from the JWT', async () => {
      mockPrisma.user.upsert.mockResolvedValue(ownerUser)
      mockPrisma.opportunity.create.mockResolvedValue(mockOpportunity)

      const dto = {
        title: 'New Opportunity',
        description: 'Desc',
        category: Category.RESEARCH,
        location: 'Lab',
        startDate: '2026-09-01',
      }

      const result = await controller.create(dto, ownerJwt)

      expect(result.organizerId).toBe('user-organizer-1')
      expect(mockPrisma.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizerId: 'user-organizer-1' }),
        }),
      )
    })
  })

  // ── Update ──────────────────────────────────────────────────

  describe('PATCH /opportunities/:id', () => {
    it('allows the owner to update their opportunity', async () => {
      mockPrisma.user.upsert.mockResolvedValue(ownerUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        organizerId: 'user-organizer-1',
      })
      mockPrisma.opportunity.update.mockResolvedValue({
        ...mockOpportunity,
        title: 'Updated Title',
      })

      const result = await controller.update(
        'opp-1',
        { title: 'Updated Title' },
        ownerJwt,
      )

      expect(result.title).toBe('Updated Title')
    })

    it('throws ForbiddenException when a different organizer tries to update', async () => {
      mockPrisma.user.upsert.mockResolvedValue(otherUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        organizerId: 'user-organizer-1', // owned by Alice, not Bob
      })

      await expect(
        controller.update('opp-1', { title: 'Hijacked' }, otherJwt),
      ).rejects.toThrow(ForbiddenException)

      expect(mockPrisma.opportunity.update).not.toHaveBeenCalled()
    })
  })

  // ── Delete ──────────────────────────────────────────────────

  describe('DELETE /opportunities/:id', () => {
    it('allows the owner to delete their opportunity', async () => {
      mockPrisma.user.upsert.mockResolvedValue(ownerUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        organizerId: 'user-organizer-1',
      })
      mockPrisma.opportunity.delete.mockResolvedValue(undefined)

      await expect(
        controller.remove('opp-1', ownerJwt),
      ).resolves.toBeUndefined()
      expect(mockPrisma.opportunity.delete).toHaveBeenCalledWith({
        where: { id: 'opp-1' },
      })
    })

    it('throws ForbiddenException when a different organizer tries to delete', async () => {
      mockPrisma.user.upsert.mockResolvedValue(otherUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        organizerId: 'user-organizer-1',
      })

      await expect(controller.remove('opp-1', otherJwt)).rejects.toThrow(
        ForbiddenException,
      )
      expect(mockPrisma.opportunity.delete).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when opportunity does not exist', async () => {
      mockPrisma.user.upsert.mockResolvedValue(ownerUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue(null)

      await expect(
        controller.remove('nonexistent', ownerJwt),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ── View registrations ──────────────────────────────────────

  describe('GET /opportunities/:id/registrations', () => {
    it('allows the owner to view registrations for their opportunity', async () => {
      mockPrisma.user.upsert.mockResolvedValue(ownerUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        organizerId: 'user-organizer-1',
      })
      mockPrisma.registration.findMany.mockResolvedValue([
        {
          id: 'reg-1',
          user: { id: 'student-1', name: 'Carol', email: 'carol@uni.edu' },
        },
      ])

      const result = await controller.findRegistrations('opp-1', ownerJwt)

      expect(result).toHaveLength(1)
      expect(result[0].user.name).toBe('Carol')
    })

    it('throws ForbiddenException when a different organizer tries to view registrations', async () => {
      mockPrisma.user.upsert.mockResolvedValue(otherUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        organizerId: 'user-organizer-1',
      })

      await expect(
        controller.findRegistrations('opp-1', otherJwt),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  // ── List own opportunities ──────────────────────────────────

  describe('GET /opportunities/mine/list', () => {
    it("returns only the organizer's own opportunities", async () => {
      mockPrisma.user.upsert.mockResolvedValue(ownerUser)
      mockPrisma.opportunity.findMany.mockResolvedValue([mockOpportunity])

      const result = await controller.findMine(ownerJwt)

      expect(result).toHaveLength(1)
      expect(mockPrisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizerId: 'user-organizer-1' },
        }),
      )
    })
  })
})
