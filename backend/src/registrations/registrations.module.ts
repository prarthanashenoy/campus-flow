import { Module } from '@nestjs/common'
import { RegistrationsService } from './registrations.service'
import { RegistrationsController } from './registrations.controller'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [UsersModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
