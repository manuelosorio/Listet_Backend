export const emailPattern =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
export const emailRequirements =
  'Enter a valid email address (for example: name@example.com).';
export const passwordPattern =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{12,72}$/;
export const passwordRequirements =
  'Password must be 12–72 characters long and include at least one letter,' +
  ' one number, and one special character (for example: ! @ # $ % ^ & *).';

export const usernamePattern =
  /^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
export const usernameRequirements =
  'Username must be 4–20 characters long, use only letters,' +
  ' numbers, periods, and underscores, and cannot start or end with' +
  ' a period or underscore or contain consecutive periods/underscores.';
