export class UserAnswerOverallResponseDto {
  userAnswerId: number;
  position: number;
  correct: boolean;
}

export class UserAnswerOverallResponse {
  userAnswerId: number;
  position: number;
  correctAnswer: string;
  userAnswer: string;
}
