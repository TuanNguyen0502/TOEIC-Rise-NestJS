import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { Repository } from 'typeorm';
import { QuestionGroupService } from 'src/question-group/question-group.service';
import { UserAnswerMapper } from './mapper/user-answer.mapper';
import { UserAnswerDetailResponse } from 'src/user-test/dto/user-answer-detail-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class UserAnswersService {
  constructor(
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepository: Repository<UserAnswer>,
    private readonly questionGroupService: QuestionGroupService,
    private readonly userAnswerMapper: UserAnswerMapper,
  ) {}

  async getUserAnswerDetailResponse(
    userAnswerId: number,
  ): Promise<UserAnswerDetailResponse> {
    const userAnswer = await this.userAnswerRepository.findOne({
      where: { id: userAnswerId },
      relations: ['question', 'question.tags'], // để có question + tags
    });

    if (!userAnswer) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Answer');
    }

    const questionGroup = await this.questionGroupService.getQuestionGroup(
      userAnswer.questionGroupId,
    );
    if (questionGroup == null)
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question group');

    return this.userAnswerMapper.toUserAnswerDetailResponse(
      userAnswer,
      questionGroup,
    );
  }
}
