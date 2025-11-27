import { UserTest } from 'src/entities/user-test.entity';
import { TestResultOverallResponse } from 'src/test/dto/test-result-overall-response.dto';

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
}
