import { UserAnswerOverallResponseDto } from './user-answer-overall-response.dto';

export class UserAnswerGroupedByTagResponseDto {
  tag: string;
  correctAnswers: number;
  wrongAnswers: number;
  correctPercent: number;
  userAnswerOverallResponses?: UserAnswerOverallResponseDto[];
}
