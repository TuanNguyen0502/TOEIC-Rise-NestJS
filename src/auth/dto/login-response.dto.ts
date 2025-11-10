import { ERole } from 'src/enums/ERole.enum';

export class LoginResponse {
  accessToken: string;
  expirationTime: number;
  userId: number;
  email: string;
  fullName: string;
  role: ERole;
}
