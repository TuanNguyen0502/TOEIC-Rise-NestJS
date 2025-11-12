import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { EGender } from 'src/enums/EGender.enum';
import { MessageConstant } from 'src/common/constants/messages.constant';
import { PROFILE_FULLNAME_PATTERN } from 'src/common/constants/constants';

export class ProfileUpdateDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @Matches(PROFILE_FULLNAME_PATTERN, {
    message: MessageConstant.FULLNAME_INVALID,
  })
  fullName: string;

  @IsEnum(EGender, { message: MessageConstant.PROFILE_GENDER_NOT_NULL })
  gender: EGender;
}
