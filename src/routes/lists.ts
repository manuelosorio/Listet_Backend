import {Router} from 'express';
import mysql from 'mysql';
import {Db} from '../database/db';
import {variables} from '../environments/variables';
import {DateUtil} from "../middleware/date";

const listRoutes = Router();
const db = new Db(mysql.createPool(variables.db))


listRoutes.get('/lists', async (req, res) =>  {
  await db.findAllLists((err, results)  => {
    if (err) {
      const errorMessage = `We failed to query lists ${err}`;
      console.log(err);
      return res.sendStatus(500).send(errorMessage);
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

listRoutes.get('/list/:username/:slug', async (req, res) =>  {
  const query = {'username': req.params.username, 'slug': req.params.slug}
  await db.findList(query, (err, results) => {
    if (err) {
      return console.log(err);
    }
    return !results.length ? res.status(404).send('List Doesn\'t Exist.').end(): res.status(200).send(results).end();
  });
});
listRoutes.get('/list/:username/:slug/items', async (req, res) =>  {
  const query = {'username': req.params.username, 'slug': req.params.slug}
  await db.findListItems(query, (err, results) => {
    if (err) {
      console.log(err)
      return res.sendStatus(500).send(err.message).end();
    }
    return res.status(200).send(results).end();
  });
});
listRoutes.get('/list/:list_id/:slug/comments', async  (req, res) =>  {
  const query = {'list_id': req.params.list_id, 'slug': req.params.slug}
  await db.findListComments(query, (err, results) => {
    if (err) {
      console.log(err);
      return res.sendStatus(500).send(err.message).end();
    }
    const updatedResults = results.map((result) => {
      const date = new DateUtil(result.creation_date);
      result.creation_date = date.format();
      return result;
    });
    return res.status(200).send(updatedResults).end();
  });
});

export default listRoutes;
