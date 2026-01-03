export class LearnerTestHistoryResponse {
  id: number;
  createdAt: string | null;
  parts: string[];
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  timeSpent: number;
}
