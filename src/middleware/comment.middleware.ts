import { NextFunction, Request, Response } from 'express';
import { CommentService } from '../services/comment.service';
import { ListService } from '../services/list.service';
import { UserService } from '../services/user.service';
import { unprocessable } from '../utilities/response';

const userService = new UserService();
const commentService = new CommentService();
const listService = new ListService();

export const canDeleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  return commentService
    .isCommentDeletionPermissible(res.locals.id as number, req.session.user.id)
    .then((isPermissible): Response | void => {
      if (!isPermissible) {
        return res.status(403).send({
          message: 'You do not have permission to delete this comment.',
        });
      }
      return next();
    });
};
export function isCommentBodyEmpty(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (req.body.comment !== undefined && req.body.comment.trim().length !== 0) {
    return next();
  }
  return res.status(400).send({ message: "Comments can't be empty." });
}

export function commentHasMinCharacters(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (req.body.comment.length > 20) {
    return next();
  }
  return res
    .status(400)
    .send({ message: 'Comments must contain at least 20 chars' });
}

export function commentNotLargerThanMaxCharacters(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  if (req.body.comment.length < 500) {
    return next();
  }
  return res
    .status(400)
    .send({ message: "Comments can't exceed 500 characters" });
}

export const isIdValid = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return unprocessable(res, 'Comment ID must be a positive integer');
  }
  res.locals.id = id;
  return next();
};

export const isCommentOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const userID = (await userService.getCurrentUser(req)).id;
  const commentId = res.locals.id;
  const isCommentOwner = await listService.isCommentOwner(userID, commentId);
  if (!isCommentOwner) {
    return res
      .status(409)
      .send({
        message: 'You must be the comment owner to complete this action',
      })
      .end();
  }
  return next();
};
