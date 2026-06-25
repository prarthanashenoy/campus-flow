import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { RegistrationsController } from './registrations.controller'
import { RegistrationsService } from './registrations.service'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuthorizationService } from '../authorization/authorization.service'
import { AppLogger } from '../logger/app-logger.service'
import { mockAuthorizationService } from '../../test/mocks/authorization.mock'
import { mockAppLogger } from '../../test/mocks/logger.mock'
import { Category, Role } from '@prisma/client'
import type { JwtPayload } from '../auth/jwt-payload.interface'

const mockUser = {
  id: 'user-1',
  auth0Id: 'auth0|user1',
  email: 'student@uni.edu',
  name: 'Test Student',
  role: Role.STUDENT,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockOpportunity = {
  id: 'opp-1',
  title: 'ML Research',
  category: Category.RESEARCH,
  location: 'Lab',
  startDate: new Date(),
  endDate: null,
  isPublished: true,
  description: '',
  capacity: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizerId: 'org-1',
}

const mockRegistration = {
  id: 'reg-1',
  userId: 'user-1',
  opportunityId: 'opp-1',
  createdAt: new Date(),
  opportunity: {
    id: 'opp-1',
    title: 'ML Research',
    category: Category.RESEARCH,
    location: 'Lab',
    startDate: new Date(),
    endDate: null,
  },
}

const mockPrisma = {
  opportunity: { findUnique: jest.fn() },
  registration: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: { upsert: jest.fn(), findUnique: jest.fn() },
}

const jwtPayload: JwtPayload = {
  sub: 'auth0|user1',
  email: 'student@uni.edu',
  name: 'Test Student',
}

describe('RegistrationsController', () => {
  let controller: RegistrationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationsController],
      providers: [
        RegistrationsService,
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthorizationService, useValue: mockAuthorizationService },
        { provide: AppLogger, useValue: mockAppLogger },
      ],
    }).compile()

    controller = module.get<RegistrationsController>(RegistrationsController)
  })

  afterEach(() => jest.clearAllMocks())

  describe('POST /opportunities/:id/register', () => {
    it('successfully registers a student for an opportunity', async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity)
      mockPrisma.registration.findUnique.mockResolvedValue(null) // not yet registered
      mockPrisma.registration.create.mockResolvedValue(mockRegistration)

      const result = await controller.register('opp-1', jwtPayload)

      expect(result.id).toBe('reg-1')
      expect(result.opportunityId).toBe('opp-1')
      expect(mockPrisma.registration.create).toHaveBeenCalledTimes(1)
    })

    it('throws ConflictException on duplicate registration', async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity)
      mockPrisma.registration.findUnique.mockResolvedValue(mockRegistration) // already registered

      await expect(controller.register('opp-1', jwtPayload)).rejects.toThrow(
        ConflictException,
      )
      expect(mockPrisma.registration.create).not.toHaveBeenCalled()
    })

    it('throws NotFoundException for a nonexistent opportunity', async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue(null)

      await expect(
        controller.register('nonexistent-id', jwtPayload),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws NotFoundException for an unpublished opportunity', async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockUser)
      mockPrisma.opportunity.findUnique.mockResolvedValue({
        ...mockOpportunity,
        isPublished: false,
      })

      await expect(controller.register('opp-1', jwtPayload)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('GET /me/registrations', () => {
    it('returns the registrations for the authenticated user', async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockUser)
      mockPrisma.registration.findMany.mockResolvedValue([mockRegistration])

      const result = await controller.getMyRegistrations(jwtPayload)

      expect(result).toHaveLength(1)
      expect(result[0].opportunity.title).toBe('ML Research')
      expect(mockPrisma.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      )
    })

    it('returns an empty array when the user has no registrations', async () => {
      mockPrisma.user.upsert.mockResolvedValue(mockUser)
      mockPrisma.registration.findMany.mockResolvedValue([])

      const result = await controller.getMyRegistrations(jwtPayload)

      expect(result).toHaveLength(0)
    })
  })
})
