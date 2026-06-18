import { Controller, Get } from '@nestjs/common'
import { UsersService } from './users.service'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'

@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getMe(@CurrentUser() jwtPayload: JwtPayload) {
    // Identity sourced exclusively from the validated JWT — never from
    // request body or query params.
    return this.usersService.findOrCreate(jwtPayload)
  }
}
