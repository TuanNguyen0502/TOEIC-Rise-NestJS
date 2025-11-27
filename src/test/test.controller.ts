import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { TestService } from './test.service';
import { PageRequestDto } from './dto/page-request.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserTestRequest } from 'src/user-test/dto/user-test-request.dto';
import { TestResultOverallResponse } from './dto/test-result-overall-response.dto';
import { UserTestService } from 'src/user-test/user-test.service';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';

@ApiTags('tests')
@Controller('tests')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly userTestService: UserTestService,
  ) {}

  /**
   * Corresponds to:
   * @GetMapping("")
   * public ResponseEntity<?> getAllTests(...)
   *
   * Note: @Query() in NestJS maps to @ModelAttribute or @RequestParam
   * for query parameters in Spring.
   */
  @Get()
  async getAllTests(@Query() pageRequest: PageRequestDto) {
    return this.testService.searchTestsByName(pageRequest);
  }

  /**
   * Corresponds to:
   * @GetMapping("/{id}")
   * public ResponseEntity<?> getTestById(@PathVariable Long id)
   *
   * Note: @Param('id', ParseIntPipe) in NestJS maps to @PathVariable Long id
   * and provides parsing and validation.
   */
  @Get(':id')
  async getTestById(@Param('id', ParseIntPipe) id: number) {
    return this.testService.getLearnerTestDetailById(id);
  }

  @Post()
  async submitTest(
    @Body() request: UserTestRequest,
    @GetCurrentUserEmail() email: string,
  ): Promise<TestResultOverallResponse> {
    return this.userTestService.calculateAndSaveUserTestResult(email, request);
  }
}
