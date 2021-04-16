import mysql from 'mysql';
import { DB_CONFIG } from '../../environments/variables';
import { NextFunction, Request, Response } from 'express';
import { DateUtil } from '../../utilities/date';
import { ListDb } from '../../database/list/list.db';
import { ListModel } from '../../models/list.model';
import { UserDb } from '../../database/user/user.db';

export class ListController {
  private readonly db: ListDb;
  private userDB: UserDb;

  constructor() {
    this.db = new ListDb(mysql.createPool(DB_CONFIG));
    this.userDB = new UserDb(mysql.createPool(DB_CONFIG));
  }
  getAll = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    await this.db.findAllLists((err, results)  => {
      if (err) {
        const errorMessage = `We failed to query lists ${err}`;
        console.error(errorMessage);
        return res.sendStatus(500).end();
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

  getSingle = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const query = {'owner_username': req.params.owner_username, 'slug': req.params.slug}
    await this.db.findListFromSlug(query,  async (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).end();
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
    if (!req.session) return res.status(401).send({ message: "You must be logged in to make a list"}).end();
    return this.userDB.findUserFromUsername(req.session.user[0].username, async (userError, userResults) => {
      if (userError) return res.status(500).end();
      const verified = userResults[0].verification_status;
      if (!verified) return res.status(403).send({ message: "Your account must be verified to send create a new list." }).end();
      return await this.db.createList(list, (err, _results, _fields) => {
        if (err) {
          console.error(err);
          return res.status(500).send(err).end();
        }
        return res.status(201).send({ message: 'List created.', url: `${username}/${list.slug}`})
      });
    })

  }

  update = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    return next('update list route');
  }
  delete = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    return next('delete list route');
  }
}
