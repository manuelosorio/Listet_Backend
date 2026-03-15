import { NextFunction, Request, Response } from 'express';
import { UserService } from '#services/user.service';
import { forbidden, unauthorized, unprocessable } from '#utilities/response';
const userService = new UserService();
export function isAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (req.session.user) {
    return next();
  }
  return unauthorized(res, 'You must be logged in to access this resource.');
}

export const isVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  return await userService
    .isUserVerified(req.session.user.id)
    .then(verified => {
      if (!verified) {
        return forbidden(
          res,
          'Your account must be verified to send create a new list.'
        );
      }
      return next();
    });
};

export function containsPassword(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!(req.body.password || req.body.currentPassword)) {
    return unprocessable(res, 'Password is required');
  }
  return next();
}
