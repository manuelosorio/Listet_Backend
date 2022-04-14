export interface UserModel {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  verification_status ?: number;
}
