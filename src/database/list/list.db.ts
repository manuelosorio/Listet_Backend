import { Db } from '../db';
import { Pool, queryCallback } from 'mysql';
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
  getListOwner = async (listID: number | any, next: queryCallback): Promise<void> => {
    await this.db.query(
      'SELECT `owner_id` from view_lists where id = ?',
      listID,
      next
    )
  }
  /**
   * Retrieve all public lists.
   * @param next
   */
   findAllLists = async (next: queryCallback): Promise<void> => {
    await this.db.query('SELECT slug, name, description, creation_date, deadline, is_private, featured, allow_comments, firstName, lastName, owner_username FROM view_lists where is_private=0', null, next);
  }


  /**
   * Find list that belongs to a particular user using a slug.
   * @param query
   * @param next`
   */
  findListFromSlug = async (query: string | any, next: queryCallback): Promise<void> => {
    await this.db.query('Select id, slug, name, description, creation_date, is_complete, deadline, is_private, allow_comments, firstName, lastName, owner_username FROM view_lists where owner_username=? and slug= ?', [query.owner_username, query.slug], next);
  }

  /**
   * Directly find a list from its ID.
   * @param query
   * @param next
   */
  findListFromID = async (query, next: queryCallback): Promise<void> => {
    await this.db.query('Select id, slug, name, description, creation_date, is_complete, deadline, is_private, allow_comments, firstName, lastName, owner_username FROM view_lists where id= ?', query, next);
  }

  /**
   * Create lists
   * @param list
   * @param next
   */
  createList = async (list: ListModel, next: queryCallback): Promise<void> => {
    await this.db.query('INSERT INTO `lists` (`slug`, `name`, `description`, `creation_date`, `deadline`, `is_private`, `allow_comments`, `user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [list.slug, list.name, list.description, list.creation_date, list.deadline, list.isPrivate, list.allowComments, list.author_id], next)
  }

}
