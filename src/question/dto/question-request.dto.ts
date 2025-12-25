import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class QuestionRequestDto {
  @IsInt({ message: MessageConstant.QUESTION_ID_NOT_NULL })
  @IsNotEmpty({ message: MessageConstant.QUESTION_ID_NOT_NULL })
  id: number;

  @IsInt({ message: MessageConstant.QUESTION_GROUP_ID_NOT_NULL })
  @IsNotEmpty({ message: MessageConstant.QUESTION_GROUP_ID_NOT_NULL })
  questionGroupId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    if (typeof value === 'object' && value.constructor === Object) {
      // Transform object to array format: { A: "text", B: "text" } -> ["A:text", "B:text"]
      return Object.keys(value).map((key) => `${key}:${value[key]}`);
    }
    return value;
  })
  @IsArray({ message: 'Options must be an array' })
  @IsString({ each: true, message: 'Each option must be a string' })
  options?: string[];

  @IsString()
  @IsNotEmpty({ message: MessageConstant.QUESTION_CORRECT_OPTION_NOT_BLANK })
  correctOption: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.QUESTION_EXPLANATION_NOT_BLANK })
  explanation: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.TAG_NOT_EMPTY })
  tags: string; // Will be a semicolon-separated string, e.g., "tag1;tag2"
}
