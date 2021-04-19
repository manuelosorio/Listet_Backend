import { Db } from '../../db';
import { Pool, Query, queryCallback } from 'mysql';
import { ListItemModel } from '../../../models/list-item.model';
import { ListQueryModel } from '../../../models/list.model';

export class ListItemDb extends Db{
  constructor(db: Pool) {
    super(db)
  }
  /**
   * Check if user Owns list item
   * @param listID
   * @param next
   */
   getListItemOwner = async (listID: number | any, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `owner_id` FROM view_list_items WHERE id = ?',
      listID,
      next
    )
  }
  /**
   * Find all list items using list owner username and slug
   * @param slug
   * @param next
   */
  findListItems = async (slug: ListQueryModel | any, next: queryCallback): Promise<Query> => {
    return this.db.query(
      `SELECT id, item, deadline, completed, list_id, slug, username
        FROM view_list_items
        WHERE slug= ?`,
      slug, next);
  }
  async updateListItemStatus(listItem: {completed: number, id: number}, next: queryCallback): Promise<Query> {
    return this.db.query(
      `UPDATE view_list_items SET completed = ? WHERE id = ? `,
      [
        listItem.completed,
        listItem.id
      ] , next);
  }
  /**
   * Delete List Item
   * @param listId
   * @param next
   */
  deleteListItem = async(listId: number, next: queryCallback): Promise<Query> => {
    return this.db.query('DELETE FROM `list_items` WHERE id = ?', listId, next)
  }
  /**
   * create list items using Parent List ID
   * @param listItem
   * @param next
   */
  addListItem = async(listItem: ListItemModel, next: queryCallback): Promise<Query> => {
    return this.db.query('INSERT INTO `list_items` (`item`, `deadline`, `completed`, `list_id`) VALUES (?, ?, ?, ?)',[listItem.item, listItem.deadline, listItem.completed, listItem.list_id], next);
  }

}
