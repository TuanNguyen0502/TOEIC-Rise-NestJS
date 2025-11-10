import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { PASSWORD_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class ResetPasswordDto {
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: MessageConstant.INVALID_PASSWORD })
  password: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.CONFIRM_PASSWORD_NOT_BLANK })
  confirmPassword: string;
}
