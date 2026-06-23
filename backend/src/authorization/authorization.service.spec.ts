import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException } from '@nestjs/common'
import { AuthorizationService } from './authorization.service'

/**
 * Tests for the centralized AuthorizationService.
 *
 * Oso Cloud is mocked so tests run without network access.
 * The mock mimics the oso-cloud v2 SDK interface.
 */

const mockOsoAuthorize = jest.fn()
const mockOsoInsert = jest.fn()
const mockOsoDelete = jest.fn()

jest.mock('oso-cloud', () => ({
  Oso: jest.fn().mockImplementation(() => ({
    authorize: mockOsoAuthorize,
    insert: mockOsoInsert,
    delete: mockOsoDelete,
  })),
}))

describe('AuthorizationService', () => {
  let service: AuthorizationService

  beforeEach(async () => {
    process.env.OSO_CLOUD_API_KEY = 'test-api-key'

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthorizationService],
    }).compile()

    service = module.get<AuthorizationService>(AuthorizationService)
    service.onModuleInit()
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.OSO_CLOUD_API_KEY
  })

  describe('authorize()', () => {
    it('resolves silently when Oso allows the action', async () => {
      mockOsoAuthorize.mockResolvedValue(true)

      await expect(
        service.authorize('user-1', 'update', 'Opportunity', 'opp-1'),
      ).resolves.toBeUndefined()

      expect(mockOsoAuthorize).toHaveBeenCalledWith(
        { type: 'User', id: 'user-1' },
        'update',
        { type: 'Opportunity', id: 'opp-1' },
      )
    })

    it('throws ForbiddenException (403) when Oso denies the action', async () => {
      mockOsoAuthorize.mockResolvedValue(false)

      await expect(
        service.authorize('user-2', 'update', 'Opportunity', 'opp-owned-by-user-1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('throws ForbiddenException when a student tries to delete an opportunity', async () => {
      mockOsoAuthorize.mockResolvedValue(false)

      await expect(
        service.authorize('student-1', 'delete', 'Opportunity', 'opp-1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('throws ForbiddenException when a non-owner tries to read_registrations', async () => {
      mockOsoAuthorize.mockResolvedValue(false)

      await expect(
        service.authorize('intruder', 'read_registrations', 'Opportunity', 'opp-1'),
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('isEnabled()', () => {
    it('returns true when OSO_CLOUD_API_KEY is set', () => {
      expect(service.isEnabled()).toBe(true)
    })

    it('returns false when OSO_CLOUD_API_KEY is not set', async () => {
      delete process.env.OSO_CLOUD_API_KEY
      const module = await Test.createTestingModule({
        providers: [AuthorizationService],
      }).compile()
      const noKeyService = module.get<AuthorizationService>(AuthorizationService)
      noKeyService.onModuleInit()
      expect(noKeyService.isEnabled()).toBe(false)
    })
  })

  describe('grantOpportunityOwner()', () => {
    it('calls oso.insert with the owner role fact tuple', async () => {
      mockOsoInsert.mockResolvedValue(undefined)

      await service.grantOpportunityOwner('user-1', 'opp-1')

      expect(mockOsoInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          'has_role',
          { type: 'User', id: 'user-1' },
          'owner',
          { type: 'Opportunity', id: 'opp-1' },
        ]),
      )
    })
  })

  describe('syncUserRole()', () => {
    it('syncs ORGANIZER role as "organizer" global fact', async () => {
      mockOsoInsert.mockResolvedValue(undefined)

      await service.syncUserRole('user-1', 'ORGANIZER')

      expect(mockOsoInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          'has_role',
          { type: 'User', id: 'user-1' },
          'organizer',
          { type: 'Opportunity', id: 'global' },
        ]),
      )
    })

    it('syncs STUDENT role as "student" global fact', async () => {
      mockOsoInsert.mockResolvedValue(undefined)

      await service.syncUserRole('user-2', 'STUDENT')

      expect(mockOsoInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          'has_role',
          { type: 'User', id: 'user-2' },
          'student',
          { type: 'Opportunity', id: 'global' },
        ]),
      )
    })
  })
})
