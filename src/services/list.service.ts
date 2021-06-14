import { CommentDb } from '../database/list/comment/comment.db';
import { ListDb } from '../database/list/list.db';
import mysql from 'mysql';
import { DB_CONFIG } from '../environments/variables';

export class ListService {
  private readonly commentDb: CommentDb;
  private readonly listDb: ListDb;

  constructor() {
    this.commentDb = new CommentDb(mysql.createPool(DB_CONFIG));
    this.listDb = new ListDb(mysql.createPool(DB_CONFIG));
  }

  public isListOwner = async (userID: number, listID: number): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
      return this.listDb.getListOwner(listID, (err, results) => {
        const listOwnerID = results[0].owner_id as unknown as number;
        return resolve(listOwnerID === userID);
      })
    });
  }
  public async isCommentOwner(userID: number, commentID: number): Promise<boolean> {
    return new Promise((resolve) => {
      return this.commentDb.getCommentOwner(commentID, (_, results) => {
        const ownerID = results[0].user_id as unknown as number;
        return resolve(ownerID === userID);
      })
    });
  }
  public async testSlug(slug: string): Promise<boolean> {
    return new Promise(resolve => {
      this.listDb.doesSlugExist(slug, (_, results) => {
        return resolve(results.length > 0);
      });
    })
  }
}
