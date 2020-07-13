import {MysqlError, Pool, PoolConnection, queryCallback} from 'mysql';
import chalk from 'chalk';
import {variables} from '../environments/variables';
import {User} from '../models/user';


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

  async query(query: string, params: any | null, next: queryCallback) {
    console.log("Fetching data");
    if (!params) this.getConnection().query(query, next);
    else this.getConnection().query(query, params, next)
  }
  async findAllUsers(next: queryCallback) {
    await this.query('Select email, username, firstName, lastName FROM users', null, next);
  }
  async findUserFromUsername (username: string, next: queryCallback) {
    await this.query('Select email, username, firstName, lastName FROM users Where username= ?', username, next)
  }
  async findUserFromEmail (email: string, next: queryCallback) {
    await this.query('Select email, username, firstName, lastName FROM users Where email= ?', email, next);
  }
  async getPassword (username: string, next: queryCallback) {
    console.log("Fetching User Data");
    await this.query("Select password FROM users Where username= ?", username, next);
  }

  async newUser (user: User, next: queryCallback) {
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
}

