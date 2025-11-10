import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { OTP_PATTERN } from 'src/common/constants/constants';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class VerifyUserDto {
  @IsEmail({}, { message: MessageConstant.INVALID_EMAIL })
  @IsNotEmpty({ message: MessageConstant.EMAIL_NOT_BLANK })
  email: string;

  @IsString()
  @Matches(OTP_PATTERN, { message: MessageConstant.INVALID_OTP })
  verificationCode: string;
}
