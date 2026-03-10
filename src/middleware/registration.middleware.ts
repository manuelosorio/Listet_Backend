import { Buffer } from 'node:buffer';
import { NextFunction, Request, Response } from 'express';
import { unprocessable } from '#utilities/response';
import {
  emailPattern,
  emailRequirements,
  passwordPattern,
  passwordRequirements,
  usernamePattern,
  usernameRequirements,
} from '#utilities/regex-patterns';

export function containsFirstName(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.body.firstName)
    return res.status(422).send({ message: 'First Name is required' }).end();
  return next();
}

export function containsLastName(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.body.lastName)
    return res.status(422).send({ message: 'Last Name is required' }).end();
  return next();
}

export function containsUsername(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.body.username)
    return res.status(422).send({ message: 'Username is required' }).end();
  if (!req.body.username.match(usernamePattern)) {
    return unprocessable(res, usernameRequirements);
  }
  return next();
}

export function containsEmail(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.body.email) {
    return unprocessable(res, 'Email is required');
  }
  next();
}
export function isEmailValid(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (!req.body.email.match(emailPattern)) {
    return unprocessable(res, emailRequirements);
  }
  return next();
}

export function isPasswordValid(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const password: string = req.body.password;
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return unprocessable(res, 'Password must be 72 bytes or fewer.');
  }
  if (!password.match(passwordPattern)) {
    return unprocessable(res, passwordRequirements);
  }
  next();
}
