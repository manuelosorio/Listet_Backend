import { NextFunction, Request, Response } from 'express';
import mysql, { MysqlError, Query } from 'mysql';
import { DB_CONFIG } from '../../../environments/variables';
import { Sockets } from '../../../utilities/sockets';
import { CommentEvents } from '../../../helper/events/comment.events';
import { CommentDb } from '../../../database/list/comment/comment.db';
import { ListCommentEmitter, ListCommentModel } from '../../../models/list-comment.model';
import { ListDb } from '../../../database/list/list.db';
import { ListService } from '../../../services/list.service';
import { UserService } from '../../../services/user.service';
import { UserModel } from '../../../models/user.model';


export class CommentController {
  private readonly db: CommentDb;
  private readonly listDb: ListDb;
  private readonly listService: ListService;
  private readonly userService = new UserService();
  constructor() {
    this.db = new CommentDb(mysql.createPool(DB_CONFIG));
    this.listDb = new ListDb(mysql.createPool(DB_CONFIG));
    this.listService = new ListService();
  }
  get = async (req: Request, res: Response): Promise<Query> => {
    return this.db.findListComments(req.params.slug, async (err: MysqlError, results) => {
      const user: Partial<UserModel> = await this.userService.getCurrentUser(req).catch((err) => {
        console.log(err);
        return {};
      }).then((user) => {
        return user;
      });
      if (err) {
        console.error(err);
        return res.sendStatus(500).end();
      }
      const updatedResults:ListCommentModel = results.map((result: ListCommentModel) => {
        result.is_owner = result.author_id === user.id ?? false;
        return result;
      });
      return res.status(200).send(updatedResults).end();
    });
  }
  /**
   * Posting Condition for Comments:
   *    - User Must Be Logged In
   *    - Comment must be at least 160 characters long.
   *    - List must have comments enabled.
   */
  post = async (req: Request, res: Response): Promise<any| Response> => {
    const user: Partial<UserModel> = await this.userService.getCurrentUser(req).catch((err) => {
      console.error(err);
      return {};
    })
    const listComment: ListCommentModel = {
      author_id: Number(user.id),
      comment: req.body.comment.trim(),
      creation_date: new Date(),
      parent_id: Number(req.body.list_id),
    };
    return this.listDb.findListFromID(listComment.parent_id,
      async (listErr: MysqlError, listResults, _listFields) => {
        if (listErr) {
          console.error(listErr)
          return res.status(500).end();
        }
        const slug = listResults[0].slug;
        if (listResults[0].allow_comments === 0) {
          res.status(400).send('Comments are disabled').end();
        }
        return await this.db.createListComments(listComment, (commentErr: MysqlError, results, _fields) => {
          if (commentErr) {
            console.error(commentErr)
            return res.status(500).end();
          }
          const commentData: ListCommentEmitter = {
            id: results.insertId,
            comment: listComment.comment,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            creation_date: listComment.creation_date,
            is_owner: user.id === listComment.author_id,
          };
          console.log(commentData);
          commentData.listInfo = slug;
          Sockets.emit(CommentEvents.CREATE_COMMENT, commentData);
          return res.status(201).send({ message: 'Comment created.' }).end();
        });
      });
  }
  update = async (req: Request, res: Response, _next: NextFunction): Promise<Query | Response | void> => {
    const commentModel: ListCommentModel = req.body;
    commentModel.id = req.params.id as unknown as number;
    commentModel.date_updated = new Date();
    commentModel.comment = commentModel.comment.trim();
    console.log(commentModel)
    return this.db.update(commentModel, (err, _) => {
      if (err) {
        console.error(err.message);
        return res.status(500).end();
      }
      Sockets.emit(CommentEvents.UPDATE_COMMENT, commentModel);
      return res.status(201).send({ message: 'Comment Updated' });
    });
  }
  delete = async (req: Request, res: Response): Promise<unknown> => {
    const commentID = req.params.id as unknown as number;
    return this.db.deleteComment(commentID, (error, _results) => {
      if (error) {
        console.error(error);
        return res.status(500).end();
      }
      Sockets.emit(CommentEvents.DELETE_COMMENT, commentID);
      return res.status(200).send({message: 'Comment Deleted'}).end();
    });
  }

  getDeletePermissible = async (_req: Request, res: Response): Promise<unknown> => {
    return res.status(200).send({can_delete: true}).end();
  }
}
