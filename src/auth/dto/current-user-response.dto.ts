export class CurrentUserResponse {
  id: number;
  fullName: string;
  avatar?: string;
  email: string;
  role: string;
  hasPassword: boolean;
}
