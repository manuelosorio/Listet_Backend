import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { comparePassword } from '../utilities/bcrypt';

const userService = new UserService();
/*
 * Checks if the inputted password matches the current account password.
 */
export const matchesAccountPassword = async (req: Request, res: Response, next: NextFunction): Promise<boolean | void> => {
  const user = await userService.getCurrentUser(req);
  const accountPassword = await userService.accountPassword(user.email);
  const password = req.body.currentPassword || req.body.password;
  const doesPasswordMatch = comparePassword(password, accountPassword);
  return doesPasswordMatch ? next() : res.status(401).send({
      message: 'The password is incorrect. Please try again.',
  }).end();
}
