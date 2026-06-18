import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { Role } from '@prisma/client'

const mockUser = {
  id: 'user-1',
  auth0Id: 'auth0|abc123',
  email: 'alice@university.edu',
  name: 'Alice Johnson',
  role: Role.STUDENT,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPrismaService = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
}

describe('UsersController – GET /me', () => {
  let controller: UsersController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
  })

  afterEach(() => jest.clearAllMocks())

  it('returns the user record derived from the JWT payload', async () => {
    mockPrismaService.user.upsert.mockResolvedValue(mockUser)

    const payload: JwtPayload = {
      sub: 'auth0|abc123',
      email: 'alice@university.edu',
      name: 'Alice Johnson',
    }

    const result = await controller.getMe(payload)

    expect(result.auth0Id).toBe('auth0|abc123')
    expect(result.email).toBe('alice@university.edu')
    // Identity must come from JWT payload, not be constructed from user input
    expect(mockPrismaService.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { auth0Id: 'auth0|abc123' },
      }),
    )
  })

  it('creates a new user on first login', async () => {
    mockPrismaService.user.upsert.mockResolvedValue({
      ...mockUser,
      auth0Id: 'auth0|newuser',
      email: 'new@university.edu',
      name: 'New User',
    })

    const payload: JwtPayload = {
      sub: 'auth0|newuser',
      email: 'new@university.edu',
      name: 'New User',
    }

    const result = await controller.getMe(payload)

    expect(result.auth0Id).toBe('auth0|newuser')
    expect(mockPrismaService.user.upsert).toHaveBeenCalledTimes(1)
  })
})
