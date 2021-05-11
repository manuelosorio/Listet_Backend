import { Db } from '../db';
import { Pool, Query, queryCallback } from 'mysql';
import { ListModel } from '../../models/list.model';


export class ListDb extends Db{
  constructor(db: Pool) {
    super(db);
  }
  /**
   * Check if user Owns list
   * @param listID
   * @param next
   */
  getListOwner = async (listID: number | any, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `owner_id` FROM view_lists WHERE id = ?',
      listID,
      next
    )
  }
  /**
   * Retrieve all public lists.
   * @param next
   */
  findAllLists = async (next: queryCallback): Promise<Query> => {
    return this.db.query('SELECT slug, name, description, creation_date, deadline, is_private, featured, allow_comments, firstName, lastName, owner_username FROM view_lists where is_private=0', null, next);
  }


  /**
   * Find list that belongs to a particular user using a slug.
   * @param query
   * @param next`
   */
  findListFromSlug = async (query: string | any, next: queryCallback): Promise<Query> => {
    return this.db.query('Select id, slug, name, description, creation_date, is_complete, deadline, is_private, allow_comments, firstName, lastName, owner_id, owner_username FROM view_lists where slug= ?', query, next);
  }

  /**
   * Directly find a list from its ID.
   * @param query
   * @param next
   */
  findListFromID = async (query: number, next: queryCallback): Promise<Query> => {
    return this.db.query('Select id, slug, name, description, creation_date, is_complete, deadline, is_private, allow_comments, firstName, lastName, owner_username FROM view_lists where id= ?', query, next);
  }

  /**
   * Create lists
   * @param list
   * @param next
   */
  createList = async (list: ListModel, next: queryCallback): Promise<Query> => {
    return this.db.query('INSERT INTO `lists` (`slug`, `name`, `description`, `creation_date`, `deadline`, `is_private`, `allow_comments`, `user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [list.slug, list.name, list.description, list.creation_date, list.deadline, list.isPrivate, list.allowComments, list.author_id], next)
  }
  doesSlugExist = async (slug: string, next: queryCallback): Promise<Query> => {
    return this.db.query('SELECT 1 from `lists` WHERE `slug` = ?', slug, next);
  }
  /**
   * Delete List
   * @param listId
   * @param next
   */
  deleteList = async(listId: number, next: queryCallback): Promise<Query> => {
    return this.db.query('DELETE FROM `lists` WHERE id = ?', listId, next)
  }
  updateList = async(listData: ListModel, next: queryCallback): Promise<Query> => {
    return this.db.query(
      `UPDATE lists SET
        slug= ?,
        name= ?,
        description= ?,
        deadline= ?,
        is_private= ?,
        allow_comments= ?
        where id = ?
        `,
      [listData.slug, listData.name, listData.description, listData.deadline, listData.isPrivate, listData.allowComments, listData.id],
      next);
  }
}
