import mysql from 'mysql';
import { DB_CONFIG } from '../../environments/variables';
import { NextFunction, Request, Response } from 'express';
import { DateUtil } from '../../utilities/date';
import { ListDb } from '../../database/list/list.db';
import { ListModel } from '../../models/list.model';

export class ListController {
  private readonly db: ListDb;

  constructor() {
    this.db = new ListDb(mysql.createPool(DB_CONFIG));
  }
  getAll = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    await this.db.findAllLists((err, results)  => {
      if (err) {
        const errorMessage = `We failed to query lists ${err}`;
        console.log(err);
        return res.sendStatus(500).send(errorMessage);
      }
      const updatedResults = results.map((result) => {
        const creationDate = new DateUtil(result.creation_date);
        result.creation_date = creationDate.format();

        if (result.deadline) {
          const deadline = new DateUtil(result.deadline);
          result.deadline = deadline.format();
        }
        return result;
      });
      return res.status(200).send(updatedResults).end();
    });
  }

  getSingle = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const query = {'owner_username': req.params.owner_username, 'slug': req.params.slug}
    await this.db.findListFromSlug(query,  async (err, results) => {
      if (err) {
        return next(err);
      }
      return !results.length ? res.status(404).send("List Doesn't Exist.").end() : res.status(200).send(results).end();
    })
  }

  post = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const id = Number(req.session.user[0].id);
    const username = req.session.user[0].username;
    const deadlineDate = new Date(req.body.deadline);
    const listPrivate = req.body.is_private === true ? 1 : 0;
    const listAllowsComments = req.body.allow_comments === true ? 1 : 0;
    const url = req.body.title.toLowerCase().split(' ').join('-');
    console.log(url);
    const list: ListModel = {
      slug: url,
      name:  req.body.title,
      description: req.body.description,
      creation_date: new Date(),
      deadline: deadlineDate,
      isPrivate: listPrivate,
      allowComments: listAllowsComments,
      author_id: id
    }
    await this.db.createList(list, (err, _results, _fields) => {
      if (err) {
        return res.status(400).send(err).end();
      } else {
        return res.status(201).send({ message: 'List created.', url: `${username}/${list.slug}`})
      }
    });
  }

  update = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    return next('update list route');
  }
  delete = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    return next('delete list route');
  }
}
