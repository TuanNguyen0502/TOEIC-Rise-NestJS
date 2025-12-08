export class TestHistoryResponse {
  id: number;
  name: string;
  createdAt: string | null;
  parts: string[] | null;
  correctAnswers: number;
  totalQuestions: number;
  totalScore: number | null;
  timeSpent: number;
}
