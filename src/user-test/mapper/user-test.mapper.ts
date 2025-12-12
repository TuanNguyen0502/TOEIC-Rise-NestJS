import { UserTest } from 'src/entities/user-test.entity';
import { TestResultOverallResponse } from 'src/test/dto/test-result-overall-response.dto';
import { UserAnswerGroupedByTagResponseDto } from '../dto/user-answer-grouped-by-tag-response.dto';
import { TestResultResponseDto } from '../dto/test-result-response.dto';

export class UserTestMapper {
  mapToDto(userTest: UserTest): TestResultOverallResponse {
    return {
      userTestId: userTest.id,
      totalQuestions: userTest.totalQuestions ?? 0,
      correctAnswers: userTest.correctAnswers ?? 0,
      score: userTest.totalScore ?? 0,
      timeSpent: userTest.timeSpent ?? 0,
    };
  }

  toTestResultResponse(
    userTest: UserTest,
    userAnswersByPart: Record<string, UserAnswerGroupedByTagResponseDto[]>,
  ): TestResultResponseDto {
    const builder: TestResultResponseDto = {
      testId: userTest.test.id,
      userTestId: userTest.id,
      testName: userTest.test.name,
      parts: userTest.parts ?? null,
      totalQuestions: userTest.totalQuestions ?? 0,
      correctAnswers: userTest.correctAnswers ?? 0,
      correctPercent: Number(userTest.correctPercent ?? 0.0),
      timeSpent: userTest.timeSpent ?? 0,
      userAnswersByPart,
      score: undefined,
      listeningScore: undefined,
      listeningCorrectAnswers: undefined,
      readingScore: undefined,
      readingCorrectAnswers: undefined,
    };

    if (userTest.totalScore !== undefined && userTest.totalScore !== null) {
      builder.score = userTest.totalScore;
      builder.listeningScore = userTest.listeningScore;
      builder.listeningCorrectAnswers = userTest.listeningCorrectAnswers;
      builder.readingScore = userTest.readingScore;
      builder.readingCorrectAnswers = userTest.readingCorrectAnswers;
    }
    return builder;
  }
}
