import { Injectable } from '@nestjs/common';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { UserAnswerDetailResponse } from 'src/user-test/dto/user-answer-detail-response.dto';
import { LearnerAnswerResponse } from 'src/user-test/dto/learner-answer-response.dto';
import { UserAnswerGroupedByTagResponseDto } from 'src/user-test/dto/user-answer-grouped-by-tag-response.dto';

@Injectable()
export class UserAnswerMapper {
  toUserAnswerDetailResponse(
    userAnswer: UserAnswer,
    questionGroup: QuestionGroup,
  ): UserAnswerDetailResponse {
    const question = userAnswer.question;

    let options: (string | null)[] = [];
    if (questionGroup.part.name.includes('2')) {
      options = [null, null, null];
    } else {
      options = question.options ?? [];
    }

    return {
      userAnswerId: userAnswer.id,
      questionId: question.id,
      userAnswer: userAnswer.answer ?? '',
      position: question.position,
      tags: (question.tags ?? []).map((tag) => tag.name),
      audioUrl: questionGroup.audioUrl,
      imageUrl: questionGroup.imageUrl,
      passage: questionGroup.passage,
      transcript: questionGroup.transcript,
      questionContent: question.content,
      options,
      correctOption: question.correctOption,
      explanation: question.explanation,
    };
  }

  toLearnerAnswerResponse(ua: UserAnswer): LearnerAnswerResponse {
    return {
      learnerAnswerId: ua.id,
      questionId: ua.question.id,
      position: ua.question.position,
      content: ua.question.content,
      options: ua.question.options,
      correctOption: ua.question.correctOption,
      explanation: ua.question.explanation ?? '',
      userAnswer: ua.answer ?? '',
      isCorrect: ua.isCorrect,
    };
  }

  toUserAnswerGroupedByTagResponse(
    userAnswer: UserAnswer,
  ): NonNullable<
    UserAnswerGroupedByTagResponseDto['userAnswerOverallResponses']
  >[number] {
    const q = userAnswer.question;
    return {
      userAnswerId: userAnswer.id,
      position: q.position,
      isCorrect: q.correctOption === userAnswer.answer,
    };
  }
}
