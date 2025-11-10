import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { PASSWORD_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class LoginDto {
  @IsEmail({}, { message: MessageConstant.INVALID_EMAIL })
  @IsNotEmpty({ message: MessageConstant.EMAIL_NOT_BLANK })
  email: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.PASSWORD_NOT_BLANK })
  @Matches(PASSWORD_PATTERN, { message: MessageConstant.INVALID_PASSWORD })
  password: string;
}
