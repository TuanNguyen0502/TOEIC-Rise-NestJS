export class LearnerTestHistoryResponse {
  id: number;
  createdAt: string | null;
  partNames: string[];
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  timeSpent: number;
}
