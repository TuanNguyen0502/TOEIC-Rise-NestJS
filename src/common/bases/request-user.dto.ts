import { ERole } from 'src/enums/ERole.enum';

export class RequestUser {
  userId: number;
  email: string;
  roles: ERole[];
}
export type RequestWithUser = Request & { user?: RequestUser };
