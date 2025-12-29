import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UserAnswerMiniTestRequest {
  @IsNumber({}, { message: 'Question ID must be a number' })
  questionId: number;

  @IsOptional()
  @IsString({ message: 'Answer must be a string' })
  answer?: string;
}
