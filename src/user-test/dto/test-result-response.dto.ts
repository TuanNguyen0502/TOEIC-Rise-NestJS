import { UserAnswerGroupedByTagResponseDto } from './user-answer-grouped-by-tag-response.dto';

export class TestResultResponseDto {
  id: number;
  testName: string;
  totalScore: number;
  readingScore: number;
  listeningScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  createdAt: Date | string | null;
  // Maps Part Name -> List of Tag Stats
  userAnswersByPart: Record<string, UserAnswerGroupedByTagResponseDto[]>;
}
