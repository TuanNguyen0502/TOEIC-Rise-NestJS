import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class QuestionRequestDto {
  @IsInt()
  @IsNotEmpty({ message: MessageConstant.QUESTION_ID_NOT_NULL })
  id: number;

  @IsInt()
  @IsNotEmpty({ message: MessageConstant.QUESTION_GROUP_ID_NOT_NULL })
  questionGroupId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.CORRECT_OPTION_NOT_BLANK })
  correctOption: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.EXPLAIN_NOT_BLANK })
  explanation: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.TAG_NOT_EMPTY })
  tags: string; // Will be a semicolon-separated string, e.g., "tag1;tag2"
}
