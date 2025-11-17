import { Controller, Get } from '@nestjs/common';
import { TestSetService } from './test-set.service';
import { TestSetResponse } from './dto/test-set-response.dto';

@Controller('test-sets')
export class TestSetController {
  constructor(private readonly testSetService: TestSetService) {}

  @Get()
  async getAllTestSets(): Promise<TestSetResponse[]> {
    return this.testSetService.getAllTestSets();
  }
}
