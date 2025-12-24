import { EAuthProvider } from 'src/enums/EAuthProvider.enum';
import { ERole } from 'src/enums/ERole.enum';
import { EGender } from 'src/enums/EGender.enum';

export class UserDetailResponse {
  userId: number;
  email: string;
  authProvider: EAuthProvider;
  isActive: boolean;
  fullName: string;
  gender?: EGender;
  avatar: string | null;
  role: ERole;
  createdAt: string;
  updatedAt: string;
}
