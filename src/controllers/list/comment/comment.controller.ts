import { NextFunction, Request, Response } from 'express';
import mysql from 'mysql';
import { Db } from '../../../database/db';
import { DB_CONFIG } from '../../../environments/variables';
import { ListComment, ListCommentEmitter } from '../../../models/_types/list-comment';
import { emit } from '../../../utilities/sockets';
import { CommentEvents } from '../../../models/events/comment.events';


export class CommentController {
  private readonly db: Db;

  constructor() {
    this.db = new Db(mysql.createPool(DB_CONFIG));
  }
  get = async (req: Request, res: Response): Promise<any> => {
    const query = {'list_owner_username': req.params.owner_username, 'slug': req.params.slug}
    await this.db.findListComments(query, (err, results) => {
      if (err) {
        console.log(err);
        return res.sendStatus(500).send(err.message).end();
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
  post = async (req: Request, res: Response): Promise<any> => {
    let id;
    let parent;
    let commentMessage;
    const currentDate = new Date();
    if (req.session.user[0].id !== undefined) {
      id = Number(req.session.user[0].id);
    }
    if (req.body.list_id !== undefined) {
      parent = Number(req.body.list_id);
    }
    if (req.body.comment !== undefined) {
      commentMessage = req.body.comment;
    }
    const listComment: ListComment = {
      author_id: id,
      comment_message: commentMessage,
      creation_date: currentDate,
      parent_id: parent,
    };
    await this.db.findListFromID(listComment.parent_id, async (listErr, listResults, _listFields) => {
      if (listErr) {
        return res.status(400).send(listErr).end();
      }
      const listOwner = listResults[0].owner_username;
      const slug = listResults[0].slug;
      console.log(listComment);
      if (listResults[0].allow_comments === 0) {
        res.status(400).send('Comments are disabled').end();
      }
      return await this.db.createListComments(listComment, (commentErr, results, _fields) => {
        if (commentErr) {
          return res.status(400).send(commentErr).end();
        }
        console.log(results);
        const user = req.session.user[0];
        const commentData: ListCommentEmitter = {
          comment: listComment.comment_message,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          creation_date: listComment.creation_date,
        };
        commentData.listInfo = `${listOwner}-${slug}`;
        emit(CommentEvents.CREATE_COMMENT, commentData);
        return res.status(201).send({ message: 'Comment created.' }).end();
      });
    });
  }
  update = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    next('update comment route');
  }
  delete = async (_req: Request, _res: Response, next: NextFunction): Promise<any> => {
    await next('delete comment route');
  }
}
