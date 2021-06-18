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
    return this.db.query('Select id, email, username, firstName, lastName, verification_status FROM users WHERE email= ?', email, next);
  }

  /**
   * Retrieve password from username.
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
   * Apply session data to the requested session user.
   * @param req
   * @param sessionData
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  userSession(req: Request, sessionData): Promise<Query> {
    console.log(sessionData)
    return req.session.user = sessionData;
  }
}
