import { Db } from '../db';
import { Pool, Query, queryCallback } from 'mysql';
import { Request } from 'express';
import { UserModel } from '../../models/user.model';

export class UserDb extends Db{
  constructor(db: Pool) {
    super(db)
  }

  // User Queries
  /**
   * Retrieve All Users
   * @param next
   */
  findAllUsers = async (next: queryCallback): Promise<Query> => {
    return this.db.query('Select username, firstName, lastName FROM users', null, next);
  }

  /**
   * Retrieve userdata [id, email, username, firstName, lastName, verification_status] from username.
   * @param username
   * @param next
   */
  findUserFromUsername = async (username: string, next: queryCallback): Promise<Query> => {
    return this.db.query('Select id, email, username, firstName, lastName, verification_status FROM users WHERE username= ?', username, next)
  }

  /**
   * Retrieve userdata [id, email, username, firstName, lastName] from email.
   * @param email
   * @param next
   */
  findUserFromEmail = async (email: string, next: queryCallback): Promise<Query> => {
    return this.db.query('Select id, email, username, firstName, lastName, verification_status, deactivated FROM users WHERE email= ?', email, next);
  }

  /**
   * Retrieve password from email.
   * @param email
   * @param next
   */
  getPassword = async (email: string, next: queryCallback): Promise<Query> => {
    console.log("Fetching User Data");
    return this.db.query("Select password FROM users Where email= ?", email, next);
  }

  /**
   * Create a New User
   * @param user
   * @param next
   */
  newUser = async (user: UserModel, next: queryCallback): Promise<Query> => {
    return this.db.query('INSERT INTO `users` (`firstName`, `lastName`, `email`, `username`, `password`, `admin`, `deactivated`) VALUES (?, ?, ?, ?, ?, ?, ?)', [
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
   * Deactivate user accounts
   * @param user
   * @param next
   */
  deactivate = async (user: UserModel, next: queryCallback): Promise<Query> => {
    return this.db.query(`UPDATE users SET deactivated = 1 WHERE id = ?`, user.id, next);
  }
  /**
   * Reactivate user accounts
   * @param user
   * @param next
   */
  reactivate = async (user: UserModel, next: queryCallback): Promise<Query> => {
    return this.db.query(`UPDATE users SET deactivated = 0 WHERE id = ?`, user.id, next);
  }

  updatePassword = async (data: {userID: number, password: string}, next: queryCallback): Promise<Query> => {
    return this.db.query(`UPDATE users SET password = ? WHERE id = ?`, [data.password, data.userID], next);
  }

  updateAccountInfo = async (user: UserModel, next: queryCallback): Promise<Query> => {
    return this.db.query(`UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?`, [user.firstName, user.lastName, user.email, user.id], next);
  }

  /**
   * Apply session data to the requested session user.
   * @param req
   * @param sessionData
   */
  userSession(req: Request, sessionData): Promise<Query> {
    return req.session.user = sessionData;
  }
}
