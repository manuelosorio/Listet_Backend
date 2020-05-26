import mysql, {queryCallback} from 'mysql';
import {variables} from '../environments/variables';
export class Db {
  static getConnection () {
    const db = mysql.createConnection(variables.db);
    db.connect((err) => {
      if(err) throw err.message;
      console.log('Connected')
    });
    return db;
  }
  static async getUsers (username: string, next: queryCallback) {
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
    console.log(myResults)
    return myResults;
  }
}
