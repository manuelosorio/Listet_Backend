import {MysqlError, Pool, PoolConnection, queryCallback} from 'mysql';
import chalk from 'chalk';
import {User} from '../models/user';
import {List} from '../models/list';
import {ListItem} from '../models/list-item';
import {ListComment} from '../models/list-comment';
import {ResetPassword} from '../models/reset-password';


export class Db {
  db: Pool;

  /**
   * Initialize Database
   * @param db
   */
  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Retrieve Database Connection
   */
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

  /**
   * Run Database Queries
   * @param query SQL query
   * @param params
   * @param next (MysqlError, fields, results)
   */
  async query(query: string, params: any | null, next: queryCallback) {
    console.log("Fetching data");
    if (!params) this.getConnection().query(query, next);
    else this.getConnection().query(query, params, next)
  }
  // User Queries
  /**
   * Retrieve All Users
   * @param next
   */
  async findAllUsers(next: queryCallback) {
    await this.query('Select username, firstName, lastName FROM users', null, next);
  }

  /**
   * Retrieve userdata [id, email, username, firstName, lastName] from username.
   * @param username
   * @param next
   */
  async findUserFromUsername(username: string, next: queryCallback) {
    await this.query('Select id, email, username, firstName, lastName, verification_status FROM users WHERE username= ?', username, next)
  }

  /**
   * Retrieve userdata [id, email, username, firstName, lastName] from email.
   * @param email
   * @param next
   */
  async findUserFromEmail(email: string, next: queryCallback) {
    await this.query('Select id, email, username, firstName, lastName, verification_status FROM users WHERE email= ?', email, next);
  }

  /**
   * Retrieve password from username.
   * @param email
   * @param next
   */
  async getPassword (email: string, next: queryCallback) {
    console.log("Fetching User Data");
    await this.query("Select password FROM users Where email= ?", email, next);
  }

  /**
   * Create a New User
   * @param user
   * @param next
   */
  async newUser(user: User, next: queryCallback) {
    await this.query('INSERT INTO `users` (`firstName`, `lastName`, `email`, `username`, `password`, `admin`, `deactivated`) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      user.firstName,
      user.lastName,
      user.email,
      user.username,
      user.password,
      0,
      0
    ], next)
  }

  /**
   * Apply session data to the requested session user.
   * @param req
   * @param sessionData
   */
  userSession(req, sessionData: object) {
    return req.session.user = sessionData;
  };

  // List Queries
  /**
   * Retrieve all public lists.
   * @param next
   */
  async findAllLists(next: queryCallback) {
    await this.query('SELECT slug, name, description, creation_date, deadline, is_private, allow_comments, firstName, lastName, owner_username FROM view_lists where is_private=0', null, next);
  }

  /**
   * Find list that belongs to a particular user using a slug.
   * @param query
   * @param next
   */
  async findListFromSlug(query, next: queryCallback) {
    await this.query('Select slug, name, description, creation_date, deadline, is_private, allow_comments, firstName, lastName, owner_username FROM view_lists where owner_username=? and slug= ?', [query.owner_username, query.slug], next);
  }

  /**
   * Directly find a list from its ID.
   * @param query
   * @param next
   */
  async findListFromID(query, next: queryCallback) {
    console.log('Query: ' + query)
    await this.query('Select id, slug, name, description, creation_date, deadline, is_private, allow_comments, firstName, lastName, owner_username FROM view_lists where id= ?', query, next);
  }

  /**
   * Find all list items using list owner username and slug
   * @param query
   * @param next
   */
  async findListItems(query, next: queryCallback) {
    await this.query('Select id, item, deadline, comment, list_id, slug, username FROM view_list_items where username=? and slug= ?', [query.username, query.slug], next);
  }

  /**
   * Find all comments using list owner username and slug
   * @param query
   * @param next
   */
  async findListComments(query, next: queryCallback) {
    await this.query('SELECT comment, creation_date, firstName, lastName, username FROM view_comments where list_owner_username=? and slug= ?', [query.list_owner_username, query.slug], next);
  }

  /**
   * Create lists
   * @param list
   * @param next
   */
  async createList(list: List, next: queryCallback) {
    await this.query('INSERT INTO `lists` (`slug`, `name`, `description`, `creation_date`, `deadline`, `is_private`, `allow_comments`, `user_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [list.slug, list.name, list.description, list.creation_date, list.deadline, list.isPrivate, list.allowComments, list.author_id], next)
  }

  /**
   * create list items using Parent List ID
   * @param listItem
   * @param next
   */
  async addListItem(listItem: ListItem, next: queryCallback) {
    await this.query('INSERT INTO `list_items` (`item`, `deadline`, `completed`, `list_id`) VALUES (?, ?, ?, ?)', [listItem.item, listItem.deadline, listItem.completed, listItem.list_id], next);
  }

  /**
   * Create Comments using Parent List ID
   * @param listComment
   * @param next
   */
  async createListComments(listComment: ListComment, next: queryCallback) {
    await this.query('INSERT INTO `list_comments` (`user_id`, `comment`, `creation_date`, `list_id`) VALUES (?, ?, ?, ?)', [listComment.author_id, listComment.comment_message, listComment.creation_date, listComment.parent_id], next);
  }

  /**
   * Add Token To User
   * @param params
   * @param next
   */
  async resetPasswordToken(params, next: queryCallback) {
    await this.query('UPDATE `users` SET reset_token= ? WHERE id= ?', [params.token, params.id], next);
  }

  /**
   * Create Token Storage for Encrypted Data
   * @param params
   * @param next
   */
  async resetPasswordTokenStore(params, next: queryCallback) {
    await this.query('INSERT INTO `token_reset_password` (token_id, expires, data) VALUES (?, ?, ?)', params, next);
  }

  /**
   * Add Token To User
   * @param params
   * @param next
   */
  async verifyAccountToken(params, next: queryCallback) {
    await this.query('UPDATE `users` SET verification_token= ? WHERE email= ?', [params.token, params.email], next);
  }

  /**
   * Create Token Storage for Encrypted Data
   * @param params
   * @param next
   */
  async verifyAccountTokenStore(params, next: queryCallback) {
    await this.query('INSERT INTO `token_verify_account` (token_id, expires, data) VALUES (?, ?, ?)', params, next);
  }

  /**
   *
   * @param params
   * @param next
   */
  async userResetPasswordToken(params, next: queryCallback) {
    await this.query('SELECT `reset_token` FROM view_tokens where reset_token= ?', [params],next);
  }
  async userVerifyAccountToken(params, next: queryCallback) {
    await this.query('SELECT `verification_token` FROM view_tokens where verification_token= ?', [params],next);
  }


  /**
   *
   * @param params
   * @param next
   */
  async getResetPasswordTokenStoreExpiration(params, next: queryCallback) {
    await this.query('SELECT `expires` FROM token_reset_password where token_id = ?', [params],next);
  }
  async getResetPasswordTokenStore(params, next: queryCallback) {
    await this.query('SELECT `data` FROM token_reset_password where token_id = ?', [params],next);
  }
  async getVerifyAccountTokenStore(params, next: queryCallback) {
    await this.query('SELECT `data` FROM token_verify_account where token_id = ?', [params],next);
  }
  async getVerifyAccountTokenStoreExpiration(params, next: queryCallback) {
    await this.query('SELECT `expires` FROM token_verify_account where token_id = ?', [params],next);
  }
  /**
   * Updates Password Deletes token
   * @param params
   * @param next
   */
  async resetPassword(params: ResetPassword,next: queryCallback) {
    await this.query(`UPDATE users SET reset_token= null, password = ? WHERE email = ?`, [params.password, params.email], next);
  }
  async userVerify(params, next: queryCallback) {
    await this.query('UPDATE users SET verification_token=null, verification_status=1 where email = ? ', [params.email],next);
  }
  async deleteResetTokenStore(params, next: queryCallback) {
    await this.query('DELETE FROM token_reset_password WHERE token_id= ?',
      [params, params], next)
  }
  async deleteVerifyTokenStore(params, next: queryCallback) {
    await this.query('DELETE FROM token_verify_account WHERE token_id= ?',
      [params, params], next)
  }
}

