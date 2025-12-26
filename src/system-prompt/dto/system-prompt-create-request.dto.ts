import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { SYSTEM_PROMPT_CONTENT_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class SystemPromptCreateRequestDto {
  @IsString()
  @IsNotEmpty({ message: MessageConstant.SYSTEM_PROMPT_CONTENT_NOT_BLANK })
  @Matches(SYSTEM_PROMPT_CONTENT_PATTERN, {
    message: MessageConstant.SYSTEM_PROMPT_CONTENT_INVALID,
  })
  @MinLength(20, { message: MessageConstant.SYSTEM_PROMPT_CONTENT_MIN_LENGTH })
  content: string;
}

