import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
const userService = new UserService();
export function isAuth(req: Request, res: Response, next: NextFunction): void | Response {
  if (req.session.user) {
    return next();
  }
  return res.status(403).send({message: 'You must be authenticated to complete that action.'}).end()
}

export const isVerified = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  return await userService.isUserVerified(req.session.user[0].username).then(verified => {
    if (!verified) {
      return res.status(403).send({ message: "Your account must be verified to send create a new list." }).end();
    }
    return next();
  });
}

export function containsPassword(req: Request, res: Response, next: NextFunction): void {
  if (!(req.body.password || req.body.currentPassword))
    return res.status(422).send({ message: 'Password is required'}).end();
  return next();
}
