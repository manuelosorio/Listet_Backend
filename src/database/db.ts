import {MysqlError, Pool, PoolConnection, queryCallback} from 'mysql';
import chalk from 'chalk';
import {variables} from '../environments/variables';
import {User} from '../models/user';
import {List} from '../models/list';
import {ListItem} from '../models/list-item';
import {ListComment} from '../models/list-comment';


export class Db {
  db: Pool;
  constructor(db) {
    this.db = db;
  }
  getConnection () {
    this.db.getConnection((err: MysqlError, connection: PoolConnection) => {
      const errMessage = "Connection to database base refused. " +
        "Please check that connection details are correct and that the database is running."
      if(err) return console.error(chalk.red(errMessage));
      console.log('Connected')
      if (connection) {
        connection.release();
        console.log("Connection has been released!")
      }
    })
    return this.db;
  }

  // User Queries
  async query(query: string, params: any | null, next: queryCallback) {
    console.log("Fetching data");
    if (!params) this.getConnection().query(query, next);
    else this.getConnection().query(query, params, next)
  }
  async findAllUsers(next: queryCallback) {
    await this.query('Select email, username, firstName, lastName FROM users', null, next);
  }
  async findUserFromUsername(username: string, next: queryCallback) {
    await this.query('Select id, email, username, firstName, lastName FROM users Where username= ?', username, next)
  }
  async findUserFromEmail(email: string, next: queryCallback) {
    await this.query('Select email, username, firstName, lastName FROM users Where email= ?', email, next);
  }
  async getPassword (username: string, next: queryCallback) {
    console.log("Fetching User Data");
    await this.query("Select password FROM users Where username= ?", username, next);
  }
  async newUser(user: User, next: queryCallback) {
    await this.query(variables.postUserQuery, [
      user.firstName,
      user.lastName,
      user.email,
      user.username,
      user.password,
      0,
      0
    ], next)
  }

  userSession(req, sessionData: object) {
    return req.session.user = sessionData;
  };

  // List Queries
  async findAllLists(next: queryCallback) {
    await this.query('SELECT slug, name, description, creation_date, deadline, isPrivate, firstName, lastName, owner_username FROM view_lists where isPrivate=0', null, next);
  }
  async findListFromSlug(query, next: queryCallback) {
    await this.query('Select slug, name, description, creation_date, deadline, isPrivate, comments_disabled, firstName, lastName, owner_username FROM view_lists where owner_username=? and slug= ?', [query.owner_username, query.slug], next);
  }
  async findListFromID(query, next: queryCallback) {
    console.log('Query: ' + query)
    await this.query('Select id, slug, name, description, creation_date, deadline, isPrivate, comments_disabled, firstName, lastName, owner_username FROM view_lists where id= ?', query, next);
  }
  async findListItems(query, next: queryCallback) {
    await this.query('Select id, item, deadline, comment, list_id, slug, username FROM view_list_items where username=? and slug= ?', [query.username, query.slug], next);
  }
  async findListComments(query, next: queryCallback) {
    await this.query('SELECT comment, creation_date, firstName, lastName, username FROM view_comments where list_owner_username=? and slug= ?', [query.list_owner_username, query.slug], next);
  }
  async createList(list: List, next: queryCallback) {
    await this.query('INSERT INTO `lists` (`slug`, `name`, `description`, `creation_date`, `deadline`, `isPrivate`, `user_id`) VALUES (?, ?, ?, ?, ?, ?, ?)', [list.slug, list.name, list.description, list.creation_date, list.deadline, list.isPrivate, list.author_id], next)
  }
  async addListItem(listItem: ListItem, next: queryCallback) {
    await this.query('INSERT INTO `list_items` (`item`, `deadline`, `completed`, `list_id`) VALUES (?, ?, ?, ?)', [listItem.item, listItem.deadline, listItem.completed, listItem.list_id], next);
  }
  async createListComments(listComment: ListComment, next: queryCallback) {
    await this.query('INSERT INTO `list_comments` (`user_id`, `comment`, `creation_date`, `list_id`) VALUES (?, ?, ?, ?)', [listComment.author_id, listComment.comment_message, listComment.creation_date, listComment.parent_id], next);
  }
}

