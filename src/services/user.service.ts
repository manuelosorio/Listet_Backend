import mysql from 'mysql'
import { UserDb } from '../database/user/user.db';
import { DB_CONFIG } from '../environments/variables';


export class UserService {
  private userDB: UserDb;
  constructor() {
    this.userDB =  new UserDb(mysql.createPool(DB_CONFIG));
  }
  public isUserVerified = async(username: string): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
      return this.userDB.findUserFromUsername(username, async (_error, results) => {
        const verified = results[0].verification_status;
        if (!verified) return resolve(false)
        return resolve(true);
      });
    })
  }
  public accountPassword = async (email: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      return this.userDB.getPassword(email, async (error, results) => {
        if (error) {
          return reject(error.message);
        }
        console.log(results)
        return resolve(results[0].password);
      })
    })
  }
}
