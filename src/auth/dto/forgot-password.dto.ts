import { IsEmail, IsNotEmpty } from 'class-validator';
import { MessageConstant } from 'src/common/constants/messages.constant';

export class ForgotPasswordDto {
  @IsEmail({}, { message: MessageConstant.INVALID_EMAIL })
  @IsNotEmpty({ message: MessageConstant.EMAIL_NOT_BLANK })
  email: string;
}
