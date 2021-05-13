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
      deadline: date,
      item: req.body.item,
      completed: 0,
      list_id: id,
      listInfo: req.body.listInfo
    }
    if (req.session.user) {
      const userId = req.session.user[0].id;
      const isOwner = await this.listService.isListOwner(userId, id);
      if (isOwner) return this.db.addListItem(listItem,
        (err, results, _fields) => {
          if (err) {
            console.error(err);
            return res.status(500).end();
          }
          listItem.id = results.insertId;
          emit(ListItemEvents.ADD_ITEM, listItem);
          return res.status(201).send({message: 'List item added.'});
        });
      return res.status(400).send({message: "You don't have permission to add items to this list."}).end();
    }
    return res.status(400).send({message: "You must be authenticated to add items to a list."})
  }
  delete = (req: Request, res: Response): Promise<Query> =>  {
    const id = req.params.id as unknown as number;
    if (req.session.user) {
      const userID = req.session.user[0].id;
      return this.db.getListItemOwner(id, ((err, result) => {
        if (err) {
          console.error(err.message);
          return res.status(500).end();
        }
        if (userID === result[0].owner_id) {
          this.db.deleteListItem(id, (error: MysqlError) => {
            if (error) {
              console.error(error.message);
              return res.status(500).end();
            }
            emit(ListItemEvents.DELETE_ITEM, id);
            return res.send({message: 'Item Deleted'}).status(202);
          }).then();
        }
      }))
    }
  }
  updateStatus = (req: Request, res: Response): Promise<Query> | Response => {
    const listItem: ListItemModel = req.body;
    if (req.session.user) {
      const userID = req.session.user[0].id;
      return this.listDb.getListOwner(listItem.list_id, (error, result) => {
        if (error) {
          console.error(error)
          return res.status(500).end();
        }
        if (userID === result[0].owner_id) {
          return this.db.updateListItemStatus({
            completed: listItem.completed,
            id: listItem.id
          }, (err, _) => {
            if (err) {
              console.error(err);
              return res.status(500).end();
            }
            emit(ListItemEvents.COMPLETE_ITEM, listItem);
            return res.status(201).send({ message: "Updated Item Status" }).end();
          })
        }
      })
    }
    return res.status(403).send({message: 'You must be authenticated to complete this action. '})
  }
  update = async (req: Request, res: Response, _next: NextFunction): Promise<Query | void> => {
    const listItem: ListItemModel = req.body;
    listItem.id = req.params.id as unknown as number;
    console.log(listItem)
    if (req.session.user) {
      const userID = req.session.user[0].id;
      return this.listDb.getListOwner(listItem.list_id, (error: MysqlError, result) => {
        if (error) {
          console.error(error)
          return res.status(500).end();
        }
        if (userID === result[0].owner_id) {

          return this.db.updateListItem(listItem, (updateErr: MysqlError, _) => {
            if (updateErr) {
              console.error(updateErr)
              return res.status(500).end();
            }
            emit(ListItemEvents.UPDATE_ITEM, listItem);
            return res.status(201).send({ message: "Item Updated" }).end();
          });
        }
      });
    }
    res.status(403).send({message: 'You must be authenticated to complete this action. '})
  }
}
