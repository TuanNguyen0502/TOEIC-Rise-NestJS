export class UserAnswerOverallResponseDto {
  userAnswerId: number;
  position: number;
  isCorrect: boolean;
}

export class UserAnswerOverallResponse {
  userAnswerId: number;
  position: number;
  correctAnswer: string;
  userAnswer: string;
}
