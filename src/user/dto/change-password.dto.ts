import { IsNotEmpty, Matches } from 'class-validator';
import { PASSWORD_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Please enter your old password!' })
  oldPassword: string;

  @Matches(PASSWORD_PATTERN, { message: MessageConstant.INVALID_PASSWORD })
  newPassword: string;

  @IsNotEmpty({ message: 'Please enter your confirm password!' })
  confirmPassword: string;
}
