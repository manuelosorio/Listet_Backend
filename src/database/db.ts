import mysql from 'mysql';
import {variables} from '../environments/variables';

const db = mysql.createConnection(variables.db);
db.connect((err) => {
  if(err) throw err.message;
  console.log('Connected')
});
export = db;
