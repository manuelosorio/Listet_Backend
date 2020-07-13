import {Router} from 'express';
import mysql from 'mysql';
import {Db} from '../database/db';
import {variables} from '../environments/variables';
import {DateUtil} from "../middleware/date";

const listRoutes = Router();
const db = new Db(mysql.createPool(variables.db))


listRoutes.get('/lists', async (req, res) =>  {
  await db.findAllLists((err, results)  => {
    const errorMessage = `We failed to query lists ${err}`;
    if (err) {
      res.sendStatus(500)
      throw errorMessage;
    }
    const updatedResults = results.map((result) => {
      const creationDate = new DateUtil(result.creation_date);
      result.creation_date = creationDate.format();

      if (result.deadline) {
        const deadline = new DateUtil(result.deadline);
        result.deadline = deadline.format();
      }
      return result;
    });
    return res.status(200).send(updatedResults).end();
  });
});

listRoutes.get('/list/:id', async (req, res) =>  {
  await db.findList(req.params.id, (err, results) => {
    if (err) {
      throw err.message;
    }
    return res.status(200).send(results).end();
  });
})
listRoutes.get('/list/:id/items', async (req, res) =>  {
  const listId = req.params.id;
  await db.findListItems(listId, (err, results) => {
    if (err) {
      throw err.message;
    }
    return res.status(200).send(results).end();
  });
})
//
listRoutes.get('/list/:id/comments', async  (req, res) =>  {
  const listId = req.params.id;
  await db.findListComments(listId, (err, results) => {

    if (err) {
      res.sendStatus(500)
      throw err.message;
    }
    const updatedResults = results.map((result) => {
      const date = new DateUtil(result.creation_date);
      result.creation_date = date.format();
      return result;
    });
    return res.status(200).send(updatedResults).end();
  });
})

export default listRoutes;
