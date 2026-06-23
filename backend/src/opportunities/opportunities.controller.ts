import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { OpportunitiesService } from './opportunities.service'
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from './dto/create-opportunity.dto'
import { Public } from '../auth/public.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'

@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  // ── Public endpoints ────────────────────────────────────────

  @Public()
  @Get()
  findAll() {
    return this.opportunitiesService.findAll()
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id)
  }

  // ── Authenticated endpoints ─────────────────────────────────

  @Get('mine/list')
  findMine(@CurrentUser() jwtPayload: JwtPayload) {
    return this.opportunitiesService.findMyOpportunities(jwtPayload)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() jwtPayload: JwtPayload,
  ) {
    return this.opportunitiesService.create(dto, jwtPayload)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() jwtPayload: JwtPayload,
  ) {
    return this.opportunitiesService.update(id, dto, jwtPayload)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() jwtPayload: JwtPayload) {
    return this.opportunitiesService.remove(id, jwtPayload)
  }

  @Get(':id/registrations')
  findRegistrations(
    @Param('id') id: string,
    @CurrentUser() jwtPayload: JwtPayload,
  ) {
    return this.opportunitiesService.findRegistrations(id, jwtPayload)
  }
}
