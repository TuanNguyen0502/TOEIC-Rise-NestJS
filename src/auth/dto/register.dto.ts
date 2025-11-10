import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  PASSWORD_PATTERN,
  FULLNAME_PATTERN,
} from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class RegisterDto {
  @IsEmail({}, { message: MessageConstant.INVALID_EMAIL })
  @IsNotEmpty({ message: MessageConstant.EMAIL_NOT_BLANK })
  email: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: MessageConstant.INVALID_PASSWORD })
  password: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.CONFIRM_PASSWORD_NOT_BLANK })
  confirmPassword: string;

  @IsString()
  @IsNotEmpty({ message: MessageConstant.FULLNAME_NOT_BLANK })
  @Matches(FULLNAME_PATTERN, { message: MessageConstant.FULLNAME_INVALID })
  fullName: string;
}
