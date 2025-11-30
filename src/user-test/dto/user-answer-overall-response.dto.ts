export class UserAnswerOverallResponseDto {
  questionId: number;
  userAnswer: string | null;
  isCorrect: boolean;
  correctOption: string; // Optional: Good for frontend context
}

export class UserAnswerOverallResponse {
  userAnswerId: number;
  position: number;
  correctAnswer: string;
  userAnswer: string;
}
