import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MiniQuestionGroupRequest } from './mini-question-group-request.dto';

export class MiniTestRequest {
  @IsNotEmpty({ message: 'Question groups must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => MiniQuestionGroupRequest)
  questionGroups: MiniQuestionGroupRequest[];
}
