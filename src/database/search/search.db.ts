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
    return this.db.query('select * from view_lists where (name like (?) or slug like (?)) and visibility = 1', [`%${searchQuery}%`, `%${searchQuery}%`], next);
  }
  searchUser = async (searchQuery, next: queryCallback) => {
    return this.db.query('select firstName, lastName, username from users where firstName like (?) or lastName like (?)', [`%${searchQuery}%`, `%${searchQuery}%`], next);
  }
}
