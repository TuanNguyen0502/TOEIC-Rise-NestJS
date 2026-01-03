export class LearnerTestHistoryResponse {
  id: number;
  createdAt: string | null;
  parts: string[] | null;
  correctAnswers: number;
  totalQuestions: number;
  totalScore: number;
  timeSpent: number;
}
