import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserAnswersService } from './user-answers.service';
import { UserAnswerDetailResponse } from 'src/user-test/dto/user-answer-detail-response.dto';

@Controller('learner/user-answers')
export class UserAnswersController {
  constructor(private readonly userAnswersService: UserAnswersService) {}

  @Get(':userAnswerId')
  async getUserAnswerDetail(
    @Param('userAnswerId', ParseIntPipe) userAnswerId: number,
  ): Promise<UserAnswerDetailResponse> {
    return this.userAnswersService.getUserAnswerDetailResponse(userAnswerId);
  }
}
