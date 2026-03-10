import { Request } from 'express';
import mysql from 'mysql';
import { UserDb } from '#database/user/user.db';
import { DB_CONFIG } from '#environments/variables';
import { UserPasswordRow, UserModel } from '#models/user.model';
import { promisify } from '#utilities/promise';

export class UserService {
  private userDB: UserDb;
  constructor() {
    this.userDB = new UserDb(mysql.createPool(DB_CONFIG));
  }
  public isUserVerified = async (id: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      return this.userDB.findUserFromId(id, async (error, results) => {
        if (error) {
          reject(error);
        }
        const verified = results[0].verification_status;
        if (!verified) return resolve(false);
        return resolve(true);
      });
    });
  };

  /**
   * @param email - email of user whose password is being retrieved
   * @returns A promise string containing hashed account password
   */
  public async accountPassword(email: string): Promise<string | null> {
    const users = await promisify<UserPasswordRow[], [string]>(
      this.userDB.getPassword.bind(this.userDB),
      email
    );

    if (!users.length) {
      return null;
    }

    return users[0].password;
  }
  public findUserFromEmail(email: string): Promise<UserModel | null> {
    return promisify<UserModel[], [string]>(
      this.userDB.findUserFromEmail.bind(this.userDB),
      email
    ).then(results => {
      return results[0] ?? null;
    });
  }
  public getCurrentUser = async (req: Request): Promise<UserModel> => {
    return new Promise((resolve, reject) => {
      if (!req.session.user) {
        return reject('No session found');
      }
      const id = req.session.user.id;
      return this.userDB.findUserFromId(id, async (error, results) => {
        if (error) {
          return reject(error.message);
        }
        return resolve(results[0]);
      });
    });
  };
}
