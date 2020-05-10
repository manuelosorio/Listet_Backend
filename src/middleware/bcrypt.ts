import Bcrypt from 'bcrypt';

export function hashPassword(password: string) {
  const salt = Bcrypt.genSaltSync(10);
  const hash = Bcrypt.hashSync(password, salt);
  return hash;
};
export function comparePassword(password: string, hash: string) {
  const compare = Bcrypt.compareSync(password, hash);
  console.log(compare);
  return compare;
}
