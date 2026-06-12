import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile()

    controller = module.get<HealthController>(HealthController)
  })

  it('should return healthy status', () => {
    const result = controller.check()
    expect(result.status).toBe('ok')
    expect(result.service).toBe('campusflow-backend')
    expect(result.timestamp).toBeDefined()
  })
})
