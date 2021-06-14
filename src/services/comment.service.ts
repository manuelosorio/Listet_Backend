import { ListService } from './list.service';
import mysql, { MysqlError, Query } from 'mysql';
import { CommentDb } from '../database/list/comment/comment.db';
import { DB_CONFIG } from '../environments/variables';
import { ListDb } from '../database/list/list.db';

export class CommentService {
  private listService: ListService;
  private commentDb: CommentDb;
  private listDb: ListDb;

  constructor() {
    this.listService = new ListService();
    this.commentDb = new CommentDb(mysql.createPool(DB_CONFIG));
    this.listDb = new ListDb(mysql.createPool(DB_CONFIG));
  }

  public isCommentDeletionPermissible = async (commentID: number, userID: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      return this.getListId(commentID).then(async (value) => {
        const listID = value.list_id;
        const isListOwner = await this.listService.isListOwner(userID, listID);
        const isCommentOwner = await this.listService.isCommentOwner(userID, commentID);
        if (isListOwner || isCommentOwner) {
          return resolve(true);
        }
        return resolve(false);
      }, ((reason: MysqlError) => {
        reject(reason);
      }))
    });
  }
  // eslint-disable-next-line camelcase
  private getListId = async (commentID: number): Promise<{ list_id: number }> => {
    return new Promise((resolve, reject): Promise<Query> => {
      return this.commentDb.query(`SELECT list_id FROM list_comments WHERE id = ?`,
        commentID, (err, results) => {
          if (err) {
            return reject(err)
          }
          return resolve(results[0]);
        })
    })
  }
}
