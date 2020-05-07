import Router from 'express';
import db from '../database/db';
import bodyParser from 'body-parser';

const listRoutes = Router();
const connection = db;
const lists = "SELECT * FROM lists";


listRoutes.use(bodyParser.json());
listRoutes.use(bodyParser.urlencoded({extended: false}))


listRoutes.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


listRoutes.get('/lists', (req, res) =>  {

  connection.query(lists, (err, results, _fields) => {
    const errorMessage = `we failed to query lists ${err}`;
    if (err) {
      res.sendStatus(500)
      throw errorMessage;
    }
    const allLists = results.map((result) => {
      return result;
    })
    res.json(allLists);
    return lists;
  });
})
listRoutes.get('/list/:id', (req, res) =>  {

  const listItems = `SELECT * FROM list_items WHERE list_id = ${req.params.id}`;
  connection.query(listItems, (err, results) => {
      if (err) {
        throw err.message;
      }
    const allItems = results.map((result) => {
      return result;
    });
    res.json(allItems);
    return results;
  });
})


listRoutes.get('/list/:id/comments', (req, res) =>  {
  const listComments = `SELECT * FROM view_comments WHERE list_id=${req.params.id}`;
  connection.query(listComments, (err, results) => {

    if (err) {
      res.sendStatus(500)
      throw err.message;
    }
    const allComments = results.map((result) => {
      return result;
    })
    res.json(allComments)
    return results;
  });
})

export default listRoutes;
