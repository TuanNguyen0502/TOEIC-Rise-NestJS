import { IsNotEmpty, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserAnswerRequest } from './user-answer-request.dto';

export class UserTestRequest {
  @IsNotEmpty({ message: 'TEST_ID_NOT_NULL' })
  testId: number;

  @Min(1, { message: 'TIME_SPENT_MIN' })
  timeSpent: number;

  parts?: string[];

  @IsNotEmpty({ message: 'ANSWERS_NOT_EMPTY' })
  @ValidateNested({ each: true })
  @Type(() => UserAnswerRequest)
  answers: UserAnswerRequest[];
}
