import { NextFunction, Request, Response } from 'express';
import { ListService } from '../services/list.service';

export function checkListTitle(req: Request, res: Response, next: NextFunction): void | Response {
  console.log(req.body.title.length)
  if (req.body.title.length > 0) {
    return next();
  }
  return res.status(400).send({ message: "Title can't be empty" });
}

export function isItemEmpty(req: Request, res: Response, next: NextFunction): void | Response  {
  if (req.body.item.length < 1) return res.status(403).send({message: "Item Can't be empty."});
  return next()
}

export const isListOwner = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const listService = new ListService();
  const isOwner = await listService.isListOwner(req.session.user[0].id, req.body.list_id);
  console.log("is owner:",isOwner)
  if (isOwner) {
    return next();
  }
  return res.status(400).send({message: "You don't have permission to add items to this list."}).end();
}
