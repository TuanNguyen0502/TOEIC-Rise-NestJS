import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserAnswerMiniTestRequest } from './user-answer-mini-test-request.dto';

export class MiniQuestionGroupRequest {
  @IsNumber({}, { message: 'Question group ID must be a number' })
  questionGroupId: number;

  @IsNotEmpty({ message: 'User answers must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => UserAnswerMiniTestRequest)
  userAnswerRequests: UserAnswerMiniTestRequest[];
}
