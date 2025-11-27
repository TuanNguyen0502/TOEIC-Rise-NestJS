export class LearnerAnswerResponse {
  learnerAnswerId: number;
  questionId: number;
  position: number;
  content: string;
  options: any;
  correctOption: string;
  explanation: string;
  userAnswer: string;
  isCorrect: boolean;
}
