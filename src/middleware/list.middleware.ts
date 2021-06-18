import { NextFunction, Request, Response } from 'express';
import { ListService } from '../services/list.service';
const listService = new ListService();
export function checkListTitle(req: Request, res: Response, next: NextFunction): void | Response {
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
  const isOwner = await listService.isListOwner(req.session.user[0].id, req.body.list_id ?? req.params.id);
  if (isOwner) {
    return next();
  }
  return res.status(400).send({message: "You don't have permission to complete that action."}).end();
}
export const isListItemOwner = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const itemID = req.params.id as unknown as number;
  const isOwner = await listService.isListItemOwner(req.session.user[0].id, itemID);
  if (isOwner) {
    return next();
  }
  return res.status(400).send({message: "You don't have permission to complete that action."}).end();
}

export const doesListExist = async(req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  listService.testSlug(req.body.slug).then((r) => {
    if (r) {
      return res.status(409).send({ message: "A list by that name already exists." }).end();
    }
    return next();
  });
}
