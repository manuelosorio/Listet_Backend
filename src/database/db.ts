import { MysqlError, Pool, PoolConnection, queryCallback, Query } from 'mysql';
import chalk from 'chalk';
/**
 * TODO: Add proper types when db methods is reworked.
 */

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
  getConnection(): Pool {
    this.db.getConnection((err: MysqlError, connection: PoolConnection) => {
      const errMessage = 'Connection to database base refused. ' +
        'Please check that connection details are correct and that the database is running.';
      if (err) return console.error(chalk.red(errMessage));
      console.log('Connected to Database');
      if (connection) {
        connection.release();
        console.log('Connection has been released!');
      }
    });
    return this.db;
  }

  /**
   * Run Database Queries
   * @param query SQL query
   * @param params
   * @param next (MysqlError, fields, results)
   */
  async query(query: string, params: any | null, next: queryCallback): Promise<Query> {
    console.log("Fetching data");
    if (!params) return this.getConnection().query(query, next);
    else return this.getConnection().query(query, params, next);
  }

}

