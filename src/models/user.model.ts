export interface UserModel {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  verificationStatus ?: boolean;
}
