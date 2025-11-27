import { IsNotEmpty } from 'class-validator';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class UserAnswerRequest {
  @IsNotEmpty({ message: MessageConstant.QUESTION_ID_NOT_NULL })
  questionId: number;

  @IsNotEmpty({ message: MessageConstant.QUESTION_GROUP_ID_NOT_NULL })
  questionGroupId: number;

  answer?: string;
}
