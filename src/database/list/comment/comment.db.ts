import { Db } from '../../db';
import { Pool, Query, queryCallback } from 'mysql';
import { ListCommentModel, ListCommentQueryModel } from '../../../models/list-comment.model';

export class CommentDb extends Db{
  constructor(db: Pool) {
    super(db)
  }

  /**
   * Find all comments using list owner username and slug
   * @param commentQueryModel
   * @param next
   */
  findListComments = async (commentQueryModel: ListCommentQueryModel, next: queryCallback): Promise<Query> => {
    return this.db.query(
      `SELECT comment, creation_date, firstName, lastName, username
        FROM view_comments
        WHERE list_owner_username=?
        AND slug= ? ORDER BY creation_date DESC`,
      [commentQueryModel.list_owner_username, commentQueryModel.slug], next);
  }

  /**
   * Create Comments using Parent List ID
   * @param listComment
   * @param next
   */
  createListComments = async (listComment: ListCommentModel, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'INSERT INTO `list_comments` (`user_id`, `comment`, `creation_date`, `list_id`) VALUES (?, ?, ?, ?)',
      [
        listComment.author_id,
        listComment.comment_message,
        listComment.creation_date,
        listComment.parent_id
      ], next);
  }


}
