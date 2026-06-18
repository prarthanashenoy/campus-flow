import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { Role } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find-or-create a User record from a validated Auth0 JWT payload.
   * The user's identity comes exclusively from the verified token — never
   * from any value supplied by the client in the request body.
   */
  async findOrCreate(payload: JwtPayload) {
    const auth0Id = payload.sub
    const email = payload.email ?? `${auth0Id}@placeholder.campusflow`
    const name = payload.name ?? 'CampusFlow User'

    return this.prisma.user.upsert({
      where: { auth0Id },
      update: { email, name },
      create: { auth0Id, email, name, role: Role.STUDENT },
    })
  }

  findByAuth0Id(auth0Id: string) {
    return this.prisma.user.findUnique({ where: { auth0Id } })
  }
}
