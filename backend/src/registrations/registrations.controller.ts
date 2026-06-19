import { Controller, Post, Get, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { RegistrationsService } from './registrations.service'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'

@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('opportunities/:id/register')
  @HttpCode(HttpStatus.CREATED)
  register(
    @Param('id') opportunityId: string,
    @CurrentUser() jwtPayload: JwtPayload,
  ) {
    return this.registrationsService.register(opportunityId, jwtPayload)
  }

  @Get('me/registrations')
  getMyRegistrations(@CurrentUser() jwtPayload: JwtPayload) {
    return this.registrationsService.findMyRegistrations(jwtPayload)
  }
}
