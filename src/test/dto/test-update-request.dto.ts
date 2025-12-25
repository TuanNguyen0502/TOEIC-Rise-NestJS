import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { TEST_NAME_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class TestUpdateRequestDto {
  @IsString()
  @IsNotEmpty({ message: MessageConstant.TEST_NAME_NOT_BLANK })
  @Matches(TEST_NAME_PATTERN, {
    message: MessageConstant.TEST_NAME_INVALID,
  })
  name: string;
}

