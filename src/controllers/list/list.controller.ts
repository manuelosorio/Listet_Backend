import mysql, { Query } from 'mysql';
import { DB_CONFIG } from '../../environments/variables';
import { NextFunction, Request, Response } from 'express';
import { DateUtil } from '../../utilities/date';
import { ListDb } from '../../database/list/list.db';
import { ListModel } from '../../models/list.model';
import { UserDb } from '../../database/user/user.db';
import { emit } from '../../utilities/sockets';
import { ListEvents } from '../../events/list.events';

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
    return await this.db.findListFromSlug(req.params.slug,  async (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).end();
      }
      return !results.length ? res.status(404).send("List Doesn't Exist.").end() : res.status(200).send(results).end();
    });
  }

  post = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const id = Number(req.session.user[0].id);
    const username = req.session.user[0].username;
    const deadlineDate = new Date(req.body.deadline);
    const listPrivate = req.body.is_private === true ? 1 : 0;
    const listAllowsComments = req.body.allow_comments === true ? 1 : 0;
    const url = req.body.title.toLowerCase().split(' ').join('-');
    const list: ListModel = {
      slug: `${username}-${url}`,
      name: req.body.title,
      description: req.body.description,
      creation_date: new Date(),
      deadline: deadlineDate,
      isPrivate: listPrivate,
      allowComments: listAllowsComments,
      author_id: id
    }
    if (!req.session) return res.status(401).send({ message: "You must be logged in to make a list" }).end();
    this.testSlug(list.slug).then((r) => {
      if (r) {
        return res.status(409).send({ message: "A list by that name already exists." }).end();
      }
      this.createList(req, res, list);
    });
  }
  update = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const list: ListModel = req.body;

    if (req.session.user) {
      const userID = req.session.user[0].id;
      const listID = req.params.id;
      const username = req.session.user[0].username;
      const url = list.name.toLowerCase().split(' ').join('-');
      return this.db.getListOwner(listID, (error, result) => {
        const listUpdate: ListModel = {
          id: listID as unknown as number,
          name: list.name,
          slug: `${username}-${url}`,
          description: list.description,
          isPrivate: list.isPrivate,
          deadline: list.deadline,
          allowComments: list.allowComments,
        }
        if (error) {
          console.error('Error Getting List Owner\n', error.message);
          return res.status(500).end();
        }
        console.log(listUpdate)
        if (userID === result[0].owner_id) {
          return this.db.updateList(listUpdate, (err, _) => {
            if (err) {
              console.error('Error Updating List\n', err.message)
              return res.status(500).end();
            }
            emit(ListEvents.UPDATE_LIST, listUpdate);
            return res.status(201).send({ message: "List Updated." }).end();
          })
        }
      })
    }
  }

  delete = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const listId = req.params.id as unknown as number;

    if (req.session.user) {
      const userID = req.session.user[0].id;
      return this.db.getListOwner(listId, (err, results)=> {
        if (err) {
          console.error(err.message);
          return res.status(500).end();
        }
        if (userID === results[0].owner_id) {
          this.db.deleteList(listId , (listErr, _) => {
            if (listErr) {
              console.error(listErr.message);
              return res.status(500).end();
            }
            emit(ListEvents.DELETE_LIST, listId);
            return res.status(200).send({message: 'list deleted'});
          });
        }
      });
    }
  }

  createList = async (req: Request, res: Response, list: ListModel): Promise<Query> => {
    return this.userDB.findUserFromUsername(req.session.user[0].username, async (userError, userResults) => {
      if (userError) return res.status(500).end();
      const verified = userResults[0].verification_status;
      if (!verified) return res.status(403).send({ message: "Your account must be verified to send create a new list." }).end();
      return await this.db.createList(list, (err, _results, _fields) => {
        if (err) {
          console.error(err);
          return res.status(500).send(err).end();
        }
        return res.status(201).send({ message: 'List created.', url: `${list.slug}`})
      });
    })
  }

  private testSlug = async (slug: string): Promise<boolean> => {
    return new Promise(resolve => {
      this.db.doesSlugExist(slug, (_, results) => {
        return resolve(results.length > 0);
      });
    })
  }
}
