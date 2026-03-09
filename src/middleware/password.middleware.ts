import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { comparePassword } from '../utilities/bcrypt';
import { unprocessable } from '../utilities/response';

const userService = new UserService();
/*
 * Checks if the inputted password matches the current account password.
 */
export const matchesAccountPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const user = await userService.getCurrentUser(req);
  const accountPassword = await userService.accountPassword(user.email);
  const password = req.body.currentPassword || req.body.password;
  const doesPasswordMatch = comparePassword(password, accountPassword);
  return doesPasswordMatch
    ? next()
    : res
        .status(401)
        .send({
          message: 'The password is incorrect. Please try again.',
        })
        .end();
};

export const containsNewPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const newPassword: string = req.body.newPassword;
  const confirmPassword: string = req.body.confirmPassword;
  if (!newPassword) {
    return unprocessable(res, 'New password is required');
  }
  if (!confirmPassword) {
    return unprocessable(res, 'Confirm password is required');
  }
  return next();
};
