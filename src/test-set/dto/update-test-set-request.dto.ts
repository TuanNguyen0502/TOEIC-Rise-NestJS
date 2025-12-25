import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
} from 'class-validator';
import { ETestSetStatus } from 'src/enums/ETestSetStatus.enum';
import { TEST_SET_NAME_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class UpdateTestSetRequestDto {
  @Matches(TEST_SET_NAME_PATTERN, {
    message: MessageConstant.INVALID_TEST_SET,
  })
  @IsNotEmpty()
  testName: string;

  @IsOptional()
  @IsEnum(ETestSetStatus)
  status?: ETestSetStatus;

  @IsNumber()
  id: number;
}
