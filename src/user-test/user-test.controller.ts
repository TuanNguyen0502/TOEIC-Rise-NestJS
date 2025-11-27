import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LearnerTestHistoryResponse } from './dto/learner-test-history-response.dto';
import { TestResultResponseDto } from './dto/test-result-response.dto';
import { UserTestService } from './user-test.service';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

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

  @Get(':userTestId')
  async getUserTestResultById(
    @Param('userTestId', ParseIntPipe) userTestId: number,
    @GetCurrentUserEmail() email: string,
  ): Promise<TestResultResponseDto> {
    return this.userTestService.getUserTestResultById(email, userTestId);
  }

  @Get('detail/:userTestId')
  async getTestDetail(
    @Param('userTestId') userTestId: number,
    @GetCurrentUserEmail() email: string,
  ) {
    return this.userTestService.getUserTestDetail(userTestId, email);
  }
}
