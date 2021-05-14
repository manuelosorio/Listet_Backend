import { NextFunction, Request, Response } from 'express';
import mysql, { MysqlError, Query } from 'mysql';
import { DB_CONFIG } from '../../../environments/variables';
import { emit } from '../../../utilities/sockets';
import { CommentEvents } from '../../../events/comment.events';
import { CommentDb } from '../../../database/list/comment/comment.db';
import { ListCommentEmitter, ListCommentModel } from '../../../models/list-comment.model';
import { ListDb } from '../../../database/list/list.db';
import { ListService } from '../../../services/list.service';


export class CommentController {
  private readonly db: CommentDb;
  private readonly listDb: ListDb;
  private readonly listService: ListService;

  constructor() {
    this.db = new CommentDb(mysql.createPool(DB_CONFIG));
    this.listDb = new ListDb(mysql.createPool(DB_CONFIG));
    this.listService = new ListService();
  }
  get = (req: Request, res: Response): Promise<Query> => {
    return this.db.findListComments(req.params.slug, (err: MysqlError, results) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500).end();
      }
      const updatedResults = results.map((result) => {
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
  post = (req: Request, res: Response): Promise<any> | Response => {
    let id;
    let parent;
    let commentMessage;
    const currentDate = new Date();
    if (req.body.list_id !== undefined) {
      parent = Number(req.body.list_id);
    }
    if (req.body.comment !== undefined) {
      commentMessage = req.body.comment;
    }
    if (req.session.user) {
      const user = req.session.user[0];
      id = Number(req.session.user[0].id);
      const listComment: ListCommentModel = {
        author_id: id,
        comment_message: commentMessage,
        creation_date: currentDate,
        parent_id: parent,
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
              comment: listComment.comment_message,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              creation_date: listComment.creation_date,
            };
            commentData.listInfo = `${slug}`;
            emit(CommentEvents.CREATE_COMMENT, commentData);
            return res.status(201).send({ message: 'Comment created.' }).end();
          });
        });
    }
    return res.status(400).send({message: 'You must be authenticated to create a new comment.'})
  }
  update = async (req: Request, res: Response, _next: NextFunction): Promise<Query | Response | void> => {
    const comment: ListCommentModel = req.body;
    comment.date_updated = new Date(req.body.date_updated);
    comment.id = req.params.id as unknown as number;
    if (req.session.user) {
      const userID = req.session.user[0].id;
      const isCommentOwner = await this.listService.isCommentOwner(userID, comment.id);
      if (isCommentOwner) {
        return this.db.update(comment, (err, _) => {
          if (err) {
            console.error(err.message);
            return res.status(500).end();
          }
          emit(CommentEvents.UPDATE_COMMENT, comment);
          return res.status(201).send({message: 'Comment Updated'});
        });
      }
      return res.status(409).send({message: "You must be the comment owner to complete this action"}).end();
    }
    return res.status(409).send({message: "You must be authenticated to complete this action"}).end();
  }
  delete = async (req: Request, res: Response): Promise<unknown> => {
    const commentID = req.params.id as unknown as number;
    if (req.session.user) {
      const userID = req.session.user[0].id;
      return this.getListId(commentID).then(async (value: any) => {
        if (value !== undefined) {
          const listID = value.list_id as unknown as number;
          const isListOwner = await this.listService.isListOwner(userID, listID);
          if (isListOwner) {
            return this.deleteComment(commentID, res);
          }
          const isCommentOwner = await this.listService.isCommentOwner(userID, commentID);
          if (isCommentOwner) {
            return this.deleteComment(commentID, res);
          }
        }
      }, ((reason: MysqlError) => {
        console.error(reason)
        return res.status(500).end();
      }))
    }
  }
  private getListId = async (commentID: number): Promise<Query> => {
    return new Promise((resolve, reject): Promise<Query> => {
      return this.db.query(`SELECT list_id FROM list_comments WHERE id = ?`,
        commentID, (err, results) => {
          if (err) {
            return reject(err)
          }
          return resolve(results[0]);
        })
    })
  }
  private deleteComment(id: number, res) {
    return this.db.deleteComment(id, (error, _results) => {
      if (error) {
        console.error(error);
        return res.status(500).end();
      }
      emit(CommentEvents.DELETE_COMMENT, id);
      return res.status(200).send({message: 'Comment Deleted'}).end();
    })
  }
}
