import { Controller, Get, Param } from '@nestjs/common'
import { OpportunitiesService } from './opportunities.service'
import { Public } from '../auth/public.decorator'

@Public()
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll() {
    return this.opportunitiesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id)
  }
}
