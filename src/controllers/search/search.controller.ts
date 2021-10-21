import { SearchDb } from "../../database/search/search.db";
import mysql from "mysql";
import { DB_CONFIG } from "../../environments/variables";

export class SearchController {
  private searchDb: SearchDb;
  constructor() {
    this.searchDb = new SearchDb(mysql.createPool(DB_CONFIG));
  }
  list = async (req, res) => {
    return this.searchDb.searchList(req.params.query, (err, results) => {
      if (err) {
        console.error(err);
        res.send(err.message);
      }
      res.send(results);
    });
  }
  user = async (req, res) => {
    return this.searchDb.searchUser(req.params.query, (err, results) => {
      if (err) {
        console.error(err);
        res.send(err.message);
      }
      res.send(results);
    });
  }
}
