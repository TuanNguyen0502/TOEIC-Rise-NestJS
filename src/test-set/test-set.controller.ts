import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestSetService } from './test-set.service';
import { TestSetResponse } from './dto/test-set-response.dto';

@ApiTags('test-sets')
@Controller('test-sets')
export class TestSetController {
  constructor(private readonly testSetService: TestSetService) {}

  @Get()
  async getAllTestSets(): Promise<TestSetResponse[]> {
    return this.testSetService.getAllTestSets();
  }
}
