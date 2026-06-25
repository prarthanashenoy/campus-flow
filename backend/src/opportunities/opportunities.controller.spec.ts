import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { OpportunitiesController } from './opportunities.controller'
import { OpportunitiesService } from './opportunities.service'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuthorizationService } from '../authorization/authorization.service'
import { AppLogger } from '../logger/app-logger.service'
import { mockAuthorizationService } from '../../test/mocks/authorization.mock'
import { mockAppLogger } from '../../test/mocks/logger.mock'
import { Category } from '@prisma/client'

const mockOrganizer = {
  id: 'user-1',
  name: 'Alice Johnson',
  email: 'alice@university.edu',
}

const mockOpportunities = [
  {
    id: 'opp-1',
    title: 'ML Research Assistant',
    description: 'Help with ML research.',
    category: Category.RESEARCH,
    location: 'AI Lab',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-12-15'),
    capacity: 3,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizerId: 'user-1',
    organizer: mockOrganizer,
    _count: { registrations: 1 },
  },
  {
    id: 'opp-2',
    title: 'Campus Volunteer',
    description: 'Help keep campus clean.',
    category: Category.VOLUNTEER,
    location: 'Campus Grounds',
    startDate: new Date('2026-09-15'),
    endDate: null,
    capacity: 20,
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizerId: 'user-1',
    organizer: mockOrganizer,
    _count: { registrations: 5 },
  },
]

const mockPrismaService = {
  opportunity: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: { upsert: jest.fn(), findUnique: jest.fn() },
}

describe('OpportunitiesController', () => {
  let controller: OpportunitiesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpportunitiesController],
      providers: [
        OpportunitiesService,
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthorizationService, useValue: mockAuthorizationService },
        { provide: AppLogger, useValue: mockAppLogger },
      ],
    }).compile()

    controller = module.get<OpportunitiesController>(OpportunitiesController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /opportunities', () => {
    it('returns a list of published opportunities', async () => {
      mockPrismaService.opportunity.findMany.mockResolvedValue(
        mockOpportunities,
      )

      const result = await controller.findAll()

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('ML Research Assistant')
      expect(mockPrismaService.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true } }),
      )
    })

    it('returns an empty array when no opportunities exist', async () => {
      mockPrismaService.opportunity.findMany.mockResolvedValue([])

      const result = await controller.findAll()

      expect(result).toHaveLength(0)
    })
  })

  describe('GET /opportunities/:id', () => {
    it('returns a single opportunity by id', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(
        mockOpportunities[0],
      )

      const result = await controller.findOne('opp-1')

      expect(result.id).toBe('opp-1')
      expect(result.title).toBe('ML Research Assistant')
      expect(mockPrismaService.opportunity.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'opp-1' } }),
      )
    })

    it('throws NotFoundException for a non-existent opportunity', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(null)

      await expect(controller.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('includes organizer info and registration count', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(
        mockOpportunities[0],
      )

      const result = await controller.findOne('opp-1')

      expect(result.organizer).toBeDefined()
      expect(result.organizer.name).toBe('Alice Johnson')
      expect(result._count.registrations).toBe(1)
    })
  })
})
