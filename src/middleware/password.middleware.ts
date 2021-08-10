import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { comparePassword } from '../utilities/bcrypt';

const userService = new UserService();

export const matchesAccountPassword = async (req: Request, res: Response, next: NextFunction) => {
  const accountPassword = await userService.accountPassword(req.session.user[0].email);
  const password = req.body.currentPassword || req.body.password;
  const doesPasswordMatch = comparePassword(password, accountPassword);
  return doesPasswordMatch ? next() : res.status(300).send({
    message: "Password does not match."
  });
}
