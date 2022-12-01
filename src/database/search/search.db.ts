import { Db } from "../db";
import { Pool, Query, queryCallback } from 'mysql';

export class SearchDb extends Db {
  constructor(db: Pool) {
    super(db)
  }
  searchList = async (searchQuery: string, next: queryCallback): Promise<Query> => {
    return this.db.query('SELECT slug, name, description, creation_date, deadline, firstName, lastName, owner_username FROM view_lists WHERE (name LIKE (?) or slug LIKE (?)) and visibility=2 and deactivated=0 ORDER BY creation_date DESC', [`%${searchQuery}%`, `%${searchQuery}%`], next);
  }
  searchUser = async (searchQuery: string, next: queryCallback): Promise<Query> => {
    return this.db.query('SELECT firstName, lastName, username FROM users WHERE firstName LIKE (?) or lastName LIKE (?) and deactivated=0 ', [`%${searchQuery}%`, `%${searchQuery}%`], next);
  }
}
