export class MiniTestAnswerQuestionResponse {
  id: number;
  position: number;
  index: number;
  content: string;
  options: (string | null)[];
  correctOption: string;
  userAnswer?: string;
  isCorrect: boolean;
}
