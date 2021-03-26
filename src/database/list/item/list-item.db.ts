import { Db } from '../../db';
import { Pool, queryCallback } from 'mysql';
import { ListItemModel } from '../../../models/list-item.model';

export class ListItemDb extends Db{
  constructor(db: Pool) {
    super(db)
  }
  /**
   * Check if user Owns list item
   * @param listID
   * @param next
   */
   getListItemOwner = async (listID: number | any, next: queryCallback): Promise<void> => {
    await this.db.query(
      'SELECT `owner_id` from view_list_items where id = ?',
      listID,
      next
    )
  }
  /**
   * Find all list items using list owner username and slug
   * @param query
   * @param next
   */
  findListItems = async (query, next: queryCallback): Promise<void> => {
    await this.db.query('Select id, item, deadline, completed, list_id, slug, username FROM view_list_items where username=? and slug= ?', [query.username, query.slug], next);
  }
  async updateListItemStatus(listItem: {completed: number, id: number}, next: queryCallback): Promise<void> {
    await this.db.query(
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
  deleteListItem = async(listId: number, next: queryCallback): Promise<void> => {
    this.db.query('DELETE FROM `list_items` WHERE id = ?', listId, next)
  }
  /**
   * create list items using Parent List ID
   * @param listItem
   * @param next
   */
  addListItem = async(listItem: ListItemModel, next: queryCallback): Promise<void> => {
    await this.db.query('INSERT INTO `list_items` (`item`, `deadline`, `completed`, `list_id`) VALUES (?, ?, ?, ?)',[listItem.item, listItem.deadline, listItem.completed, listItem.list_id], next);
  }

}
