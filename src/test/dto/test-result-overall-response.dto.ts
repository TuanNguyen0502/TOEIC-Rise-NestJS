import { ApiProperty } from '@nestjs/swagger';

export class TestResultOverallResponse {
  @ApiProperty()
  userTestId: number;

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  correctAnswers: number;

  @ApiProperty()
  score: number;

  @ApiProperty()
  timeSpent: number;
}
