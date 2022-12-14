import mysql from 'mysql'
import { UserDb } from '../database/user/user.db';
import { DB_CONFIG } from '../environments/variables';
import { Request} from 'express';
import { UserModel } from '../models/user.model';


export class UserService {
  private userDB: UserDb;
  constructor() {
    this.userDB =  new UserDb(mysql.createPool(DB_CONFIG));
  }
  public isUserVerified = async(id: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      return this.userDB.findUserFromId(id, async (error, results) => {
        if (error) {
          reject(error);
        }
        const verified = results[0].verification_status;
        if (!verified) return resolve(false)
        return resolve(true);
      });
    })
  }
  /*
   * @param options (email)
   * @returns A promise string containing hashed account password
   */
  public accountPassword = async (email: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      return this.userDB.getPassword(email, async (error, results) => {
        if (error) {
          return reject(error.message);
        }
        return resolve(results[0].password);
      });
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
  }
}
