import { EGender } from 'src/enums/EGender.enum';

export class ProfileResponseDto {
  email: string;
  fullName: string;
  gender?: EGender;
  avatar?: string;
}
