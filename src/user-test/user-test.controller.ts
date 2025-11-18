import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LearnerTestHistoryResponse } from './dto/learner-test-history-response.dto';
import { UserTestService } from './user-test.service';
import { GetCurrentUserEmail } from 'src/common/utils/decorators/get-current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('learner/user-tests')
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
}
