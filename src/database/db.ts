import mysql, {queryCallback} from 'mysql';
import chalk from 'chalk';
import {variables} from '../environments/variables';


export class Db {
  static getConnection () {
    const db = mysql.createPool(variables.db);
    db.getConnection((err) => {
      const errMessage = "Connection to database base refused. " +
        "Please check that connection details are correct and that the database is running."
      if(err) return console.error(chalk.red(errMessage));
      console.log('Connected')
    });
    return db;
  }
  static async findUser (username: string, next: queryCallback) {
    console.log("Fetching User Data");
    let myResults: object;
    this.getConnection().query("Select * FROM users Where username=" + `\"${username}\"`, (err, rows, fields) => {
      if (err) {
        console.log("Failed to get users data");
        next(err, null);
      }
      console.log("Fetched Users Successfully");
      myResults = Object.values(JSON.parse(JSON.stringify(rows)))
      next(null, rows)
      return rows;
    })
    console.log(myResults);
    return myResults;
  }
}
