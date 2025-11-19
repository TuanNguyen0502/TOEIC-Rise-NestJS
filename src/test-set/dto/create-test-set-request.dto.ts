import { IsNotEmpty, Matches } from 'class-validator';
import { TEST_SET_NAME_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class CreateTestSetRequestDto {
  @Matches(TEST_SET_NAME_PATTERN, {
    message: MessageConstant.INVALID_TEST_SET,
  })
  @IsNotEmpty()
  testName: string;
}
