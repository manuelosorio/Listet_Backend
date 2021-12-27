import { Db } from "../db";
import { Pool, queryCallback } from "mysql";

export class SearchDb extends Db {
  constructor(db: Pool) {
    super(db)
  }
  search = async (searchQuery, next: queryCallback) => {
    return this.db.query('', [], next);
  }
  searchList = async (searchQuery, next: queryCallback) => {
    return this.db.query('SELECT slug, name, description, creation_date, deadline, firstName, lastName, owner_username FROM view_lists WHERE (name LIKE (?) or slug LIKE (?)) and visibility=2 and deactivated=0 ORDER BY creation_date DESC', [`%${searchQuery}%`, `%${searchQuery}%`], next);
  }
  searchUser = async (searchQuery, next: queryCallback) => {
    return this.db.query('SELECT firstName, lastName, username FROM users WHERE firstName LIKE (?) or lastName LIKE (?)', [`%${searchQuery}%`, `%${searchQuery}%`], next);
  }
}
