import { NextFunction, Request, Response } from 'express';

export function isAuth(req: Request, res: Response, next: NextFunction): void | Response {
  if (req.session.user) {
    return next();
  }
  return res.status(403).send({message: 'You must be authenticated to complete that action.'})
}
