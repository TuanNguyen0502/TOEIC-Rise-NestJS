import { UserAnswerGroupedByTagResponseDto } from './user-answer-grouped-by-tag-response.dto';

export class TestResultResponseDto {
  testId: number;
  userTestId: number;
  testName: string;
  parts: string[] | null;
  totalQuestions: number;
  correctAnswers: number;
  correctPercent: number;
  timeSpent: number;
  
  // Các trường cho full test
  score?: number;
  listeningScore?: number;
  listeningCorrectAnswers?: number;
  readingScore?: number;
  readingCorrectAnswers?: number;

  userAnswersByPart: Record<string, UserAnswerGroupedByTagResponseDto[]>;
}
