import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Post,
  Body,
} from '@nestjs/common';
import { LearnerTestHistoryResponse } from './dto/learner-test-history-response.dto';
import { UserTestService } from './user-test.service';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TestResultResponseDto } from './dto/test-result-response.dto';
import { LearnerTestPartsResponse } from './dto/learner-test-parts-response.dto';
import { UserTestRequest } from './dto/user-test-request.dto';
import { TestResultOverallResponse } from 'src/test/dto/test-result-overall-response.dto';

@ApiTags('learner/user-tests')
@ApiBearerAuth('JWT')
@Controller('learner/user-tests')
@UseGuards(JwtAuthGuard)
export class UserTestController {
  constructor(private readonly userTestService: UserTestService) {}

  @Get('view-histories/:id')
  @UseGuards(JwtAuthGuard)
  getTestHistory(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUserEmail() email: string,
  ): Promise<LearnerTestHistoryResponse[]> {
    return this.userTestService.allLearnerTestHistories(id, email);
  }

  @Get('exam/:id')
  async getTestByParts(
    @Param('id', ParseIntPipe) id: number,
    @Query('parts') parts: string,
  ) {
    const partIds = parts
      ? parts.split(',').map((p) => parseInt(p.trim()))
      : [];
    return this.userTestService.getTestByIdAndParts(id, partIds);
  }

  @Get('answers-overall/:userTestId')
  async getUserAnswersOverallGroupedByPart(
    @Param('userTestId', ParseIntPipe) userTestId: number,
    @GetCurrentUserEmail() email: string,
  ): Promise<Record<string, any[]>> {
    return await this.userTestService.getUserAnswersGroupedByPart(
      email,
      userTestId,
    );
  }

  @Get('detail/:userTestId')
  getTestDetail(
    @Param('userTestId', ParseIntPipe) userTestId: number,
    @GetCurrentUserEmail('email') email: string,
  ): Promise<LearnerTestPartsResponse> {
    return this.userTestService.getUserTestDetail(userTestId, email);
  }

  @Get(':userTestId')
  async getUserTestResultById(
    @Param('userTestId', ParseIntPipe) userTestId: number,
    @GetCurrentUserEmail('email') email: string,
  ): Promise<TestResultResponseDto> {
    return this.userTestService.getUserTestResultById(email, userTestId);
  }

  @Post()
  async submitTest(
    @Body() request: UserTestRequest,
    @GetCurrentUserEmail('email') email: string,
  ): Promise<TestResultOverallResponse> {
    return this.userTestService.calculateAndSaveUserTestResult(email, request);
  }
}
