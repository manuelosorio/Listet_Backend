import Bcrypt from 'bcrypt';

export const hashPassword = (password: string): string => {
  const salt = Bcrypt.genSaltSync(10);
  return Bcrypt.hashSync(password, salt);
}
export const comparePassword = (password: string, hash: string): boolean => {
  return Bcrypt.compareSync(password, hash);
}
