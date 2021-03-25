import { Db } from '../../../database/db';
import mysql from 'mysql';
import { DB_CONFIG } from '../../../environments/variables';
import { NextFunction, Request, Response } from 'express';
import { emit } from '../../../utilities/sockets';
import { ListItemEvents } from '../../../models/events/list-item.events';
import { ListItemModel } from '../../../models/_types/list-item';

export class ItemController {
  private readonly db: Db;
  constructor() {
    this.db = new Db(mysql.createPool(DB_CONFIG));
  }

  get = async (req: Request, res: Response): Promise<any> => {
    const query = {'username': req.params.owner_username, 'slug': req.params.slug}
    await this.db.findListItems(query, (err, results) => {
      if (err) {
        console.log(err)
        return res.sendStatus(500).send(err.message).end();
      }
      return res.status(200).send(results).end();
    });
  }
  post = async (req: Request, res: Response): Promise<any> => {
    const id = Number(req.body.list_id);
    const date = req.body.deadline ? req.body.deadline : null;
    const listItem: ListItemModel = {
      id: 0,
      deadline: date,
      item: req.body.item,
      completed: 0,
      list_id: id,
      listInfo: req.body.listInfo
    }
    await this.db.addListItem(listItem, (err, results, _fields) => {
      if (err) {
        console.error(err);
        return res.status(400).send(err).end();
      }
      listItem.id = results.insertId;
      emit(ListItemEvents.ADD_ITEM, listItem);
      return res.status(201).send({message: 'List item added.'});
    });
  }
  delete = async (req: Request, res: Response): Promise<any> =>  {
    const id = req.params.id as unknown as number;
    if (req.session.user) {
      const userID = req.session.user[0].id;
      await this.db.getListItemOwner(id, ((err, result) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send(err).end();
        }
        if (userID === result[0].owner_id) {
          this.db.deleteListItem(id, error => {
            if (error) {
              console.error(error.message);
              return res.status(500).send(error).end();
            }
            emit(ListItemEvents.DELETE_ITEM, id);
            return res.send({message: 'Item Deleted'}).status(202);
          })
        }
      }))
    }
  }
  updateStatus = async (req: Request, res: Response): Promise<any> => {
    const listItem: ListItemModel = req.body;
    if (req.session.user) {
      const userID = req.session.user[0].id;
      await this.db.getListOwner(listItem.list_id, async (error, result) => {
        if (error) {
          console.error(error)
          return res.status(500).send(error).end();
        }
        if (userID === result[0].owner_id) {
          return await this.db.updateListItemStatus({
            completed: listItem.completed,
            id: listItem.id
          }, (err, _) => {
            if (err) {
              console.error(err)
              return res.status(500).send(err).end();
            }

            emit(ListItemEvents.COMPLETE_ITEM, listItem);
            return res.status(201).send({ message: "Updated Item Status" }).end();
          })
        }
      })
    }
  }
  update = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    next('update list item route');
  }
}
