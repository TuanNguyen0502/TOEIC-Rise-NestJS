import { UserAnswerGroupedByTagResponse } from './user-answer-grouped-by-tag-response.dto';

export class ExamTypeStatsResponse {
  totalQuestions: number;
  totalCorrectAnswers: number;
  correctPercent: number;
  userAnswersByPart: Record<string, UserAnswerGroupedByTagResponse[]>;
}
