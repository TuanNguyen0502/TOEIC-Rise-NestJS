import { ERole } from 'src/enums/ERole.enum';

export class UserResponse {
  userId: number;
  email: string;
  isActive: boolean;
  fullName: string;
  avatar: string | null;
  role: ERole;
  updatedAt: string;
}
