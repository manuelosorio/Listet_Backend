import mysql, { MysqlError, Query } from 'mysql';
import { DB_CONFIG } from '../../../environments/variables';
import { NextFunction, Request, Response } from 'express';
import { emit } from '../../../utilities/sockets';
import { ListItemEvents } from '../../../events/list-item.events';
import { ListItemModel } from '../../../models/list-item.model';
import { ListItemDb } from '../../../database/list/item/list-item.db';
import { ListDb } from '../../../database/list/list.db';
import { ListService } from '../../../services/list.service';

export class ItemController {
  private readonly db: ListItemDb;
  private readonly listDb: ListDb
  private readonly listService: ListService;
  constructor() {
    this.db = new ListItemDb(mysql.createPool(DB_CONFIG));
    this.listDb = new ListDb(mysql.createPool(DB_CONFIG));
    this.listService = new ListService();
  }

  get = (req: Request, res: Response): Promise<Query> => {
    return this.db.findListItems(req.params.slug, (err, results) => {
      if (err) {
        console.error(err)
        return res.sendStatus(500).end();
      }
      return res.status(200).send(results).end();
    });
  }
  post = async (req: Request, res: Response): Promise<Query | void | Response> => {
    const id = Number(req.body.list_id);
    const date = req.body.deadline ? req.body.deadline : null;
    const listItem: ListItemModel = {
      id: 0,
      item: req.body.item,
      deadline: date,
      completed: 0,
      list_id: id,
      slug: req.body.slug
    }
    return this.db.addListItem(listItem, (err, results, _fields) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      listItem.id = results.insertId;
      emit(ListItemEvents.ADD_ITEM, listItem);
      return res.status(201).send({message: 'List item added.'});
    });
  }
  delete = (req: Request, res: Response): Promise<Query> =>  {
    const id = req.params.id as unknown as number;
    return this.db.deleteListItem(id, (error: MysqlError) => {
      if (error) {
        console.error(error.message);
        return res.status(500).end();
      }
      emit(ListItemEvents.DELETE_ITEM, id);
      return res.send({message: 'Item Deleted'}).status(202);
    });
  }
  updateStatus = (req: Request, res: Response): Promise<Query> | Response => {
    const listItem: ListItemModel = req.body;
    return this.db.updateListItemStatus(listItem, (err, _) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      emit(ListItemEvents.COMPLETE_ITEM, listItem);
      return res.status(201).send({ message: "Updated Item Status" }).end();
    })
  }
  update = async (req: Request, res: Response, _next: NextFunction): Promise<Query | Response | void> => {
    const listItem: ListItemModel = req.body;
    listItem.deadline = new Date(req.body.deadline);
    listItem.id = req.params.id as unknown as number;
      return this.db.updateListItem(listItem, (updateErr: MysqlError, _) => {
        if (updateErr) {
          console.error(updateErr)
          return res.status(500).end();
        }
        emit(ListItemEvents.UPDATE_ITEM, listItem);
        return res.status(201).send({ message: "Item Updated" }).end();
      });
  }
}
