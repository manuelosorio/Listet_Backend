import mysql, { MysqlError, Query } from 'mysql';
import { DB_CONFIG } from '../../environments/variables';
import { NextFunction, Request, Response } from 'express';
import { ListDb } from '../../database/list/list.db';
import { ListModel, ListOwnerModel } from '../../models/list.model';
import { UserDb } from '../../database/user/user.db';
import { Sockets } from '../../utilities/sockets';
import { ListEvents } from '../../helper/events/list.events';
import { ListService } from '../../services/list.service';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';

export class ListController {
  private readonly db: ListDb;
  private userDB: UserDb;
  private listService: ListService;
  private readonly userService;
  constructor() {
    this.db = new ListDb(mysql.createPool(DB_CONFIG));
    this.userDB = new UserDb(mysql.createPool(DB_CONFIG));
    this.listService = new ListService();
    this.userService = new UserService();
  }
  getAll = async (req: Request, res: Response, _next: NextFunction): Promise<Query | void> => {
    return await this.db.findAllLists(async (err, results: ListOwnerModel[]) => {
      if (err) {
        const errorMessage = `We failed to query lists ${err}`;
        console.error(errorMessage);
        return res.sendStatus(500).end();
      }
      return res.status(200).send(results).end();
    });
  }
  getAuthUserLists = async (req: Request, res: Response, _next: NextFunction): Promise<Query> => {
    const user = await this.userService.getCurrentUser(req).catch((err) => {
      console.error(err);
    });
    return await this.db.findAuthenticatedUserLists(user.id, (err: MysqlError, results) => {
      if (err) {
        console.error(err.message);
      }
      return res.status(200).send(results).end();
    })
  }
  getSingle = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    return await this.db.findListFromSlug(req.params.slug,  async (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).end();
      }
      if (!results.length) return res.status(404).send("List Doesn't Exist.").end()
      const updatedResults = results.map((result: ListOwnerModel) => {
        if (!req.session.user) {
          return {
            ...result,
            is_owner: false
          }
        }
        return {
          ...result,
          is_owner: result.owner_id === req.session.user.id
        }
      });
      return res.status(200).send(updatedResults).end();
    });
  }

  post = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const user: UserModel= await this.userService.getCurrentUser(req);
    const url = req.body.title.toLowerCase().replace(/[^a-zA-Z ]/g, "").split(' ').join('-');
    const list: ListModel = {
      slug: `${user.username}-${url}`,
      name: req.body.title,
      description: req.body.description,
      creation_date: new Date(),
      deadline: new Date(req.body.deadline),
      visibility: req.body.visibility ?? 2,
      allow_comments: req.body.allow_comments === true ? 1 : 0,
      author_id: req.session.user.id as unknown as number
    }
    this.listService.testSlug(list.slug).then((r) => {
      if (r) {
        return res.status(409).send({ message: "A list by that name already exists." }).end();
      }
      this.createList(req, res, list);
    });
  }
  update = async (req: Request, res: Response): Promise<any> => {
    const user: UserModel = await this.userService.getCurrentUser(req);
    const url = req.body.title.toLowerCase()
      .replace(/[^a-zA-Z ]/g, "").split(' ').join('-');
    const listUpdate: ListModel = {
      id: req.params.id as unknown as number,
      name: req.body.title,
      slug: `${user.username}-${url}`,
      prevSlug: req.body.prevSlug,
      description: req.body.description,
      deadline: new Date(req.body.deadline),
      visibility: req.body.visibility,
      allow_comments: req.body.allow_comments === true ? 1 : 0,
    }
    return this.db.updateList(listUpdate, (err, _) => {
      if (err) {
        console.error('Error Updating List\n', err.message)
        return res.status(500).end();
      }
      Sockets.emit(ListEvents.UPDATE_LIST, listUpdate);
      return res.status(201).send({ message: "List Updated." }).end();
    });
  }

  delete = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const listId = req.params.id as unknown as number;
    return this.db.deleteList(listId , (listErr, _) => {
      if (listErr) {
        console.error(listErr.message);
        return res.status(500).end();
      }
      Sockets.emit(ListEvents.DELETE_LIST, listId);
      return res.status(200).send({message: 'list deleted'});
    });
  }

  createList = async (req: Request, res: Response, list: ListModel): Promise<Query> => {

    return await this.db.createList(list, (err, _results, _fields) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message).end();
      }
      return res.status(201).send({ message: 'List created.', url: list.slug }).end();
    });
  }
}
