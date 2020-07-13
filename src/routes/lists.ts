import {Router} from 'express';
import mysql from 'mysql';
import {Db} from '../database/db';
import {variables} from '../environments/variables';

const listRoutes = Router();
const db = new Db(mysql.createPool(variables.db))




// listRoutes.get('/lists', (req, res) =>  {
//
//   connection.query(lists, (err, results, _fields) => {
//     const errorMessage = `We failed to query lists ${err}`;
//     if (err) {
//       res.sendStatus(500)
//       throw errorMessage;
//     }
//     const allLists = results.map((result) => {
//       return result;
//     })
//     res.json(allLists);
//     return lists;
//   });
// })
// listRoutes.get('/list/:id', (req, res) =>  {
//
//   const listItems = `SELECT * FROM list_items WHERE list_id = ${req.params.id}`;
//   connection.query(listItems, (err, results) => {
//       if (err) {
//         throw err.message;
//       }
//     const allItems = results.map((result) => {
//       return result;
//     });
//     res.json(allItems);
//     return results;
//   });
// })
// listRoutes.get('/list/:id/comments', (req, res) =>  {
//   const listComments = `SELECT * FROM view_comments WHERE list_id=${req.params.id}`;
//   connection.query(listComments, (err, results) => {
//
//     if (err) {
//       res.sendStatus(500)
//       throw err.message;
//     }
//     const allComments = results.map((result) => {
//       return result;
//     })
//     res.json(allComments)
//     return results;
//   });
// })

export default listRoutes;
