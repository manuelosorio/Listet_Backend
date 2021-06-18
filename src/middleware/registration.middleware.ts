import { NextFunction, Request, Response } from 'express';

export function containsFirstName(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.body.firstName)
    return res.status(422).send({ message: 'First Name is required' }).end();
  return next();
}

export function containsLastName(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.body.lastName)
    return res.status(422).send({ message: 'Last Name is required' }).end();
  return next();
}

export function containsUsername(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.body.username)
    return res.status(422).send({ message: 'Username is required' }).end()
  if (!req.body.username.match(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/))
    return res.status(422).send({ message: '' }).end();
  return next();
}

export function containsEmail(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.body.email)
    return res.status(422).send({ message: 'Email is required' }).end();
  next()
}
export function isEmailValid(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.body.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,4}$/))
    return res.status(422).send({ message: 'Email is invalid' }).end();
  return next();
}

export function isPasswordValid(req: Request, res: Response, next: NextFunction): void | Response {
  if (!req.body.password.match(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@$!%*#?&])([a-zA-Z0-9\d@$!%*#?&]+){8,}/)) {
    return res.status(422).send(
      {
        message: 'passwords must be at least 8 characters long, contain 1 capital letter, ' +
          'a special character (@ $ ! % * # ? &), and at least one number.'
      }).end();
  }
  next();
}
