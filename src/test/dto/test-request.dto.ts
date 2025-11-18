import { IsNotEmpty, IsString, Matches, Min, IsNumber } from 'class-validator';
import { TEST_NAME_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';
import { Type } from 'class-transformer';

export class TestRequestDto {
  @IsString()
  @IsNotEmpty({ message: MessageConstant.TEST_NAME_NOT_BLANK })
  @Matches(TEST_NAME_PATTERN, {
    message: MessageConstant.TEST_NAME_INVALID,
  })
  testName: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: MessageConstant.INVALID_TEST_SET_ID })
  testSetId: number;
}
