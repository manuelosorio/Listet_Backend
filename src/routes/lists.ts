import { Router } from 'express';
import mysql from 'mysql';
import { Db } from '../database/db';
import * as vars from '../environments/variables';
import { DateUtil } from "../middleware/date";
import { List } from '../models/list';
import { ListItem } from '../models/list-item';
import { ListComment, ListCommentEmitter } from '../models/list-comment';
import { emit } from "../middleware/sockets";
import { CommentEvents } from "../events/comment.events";

const listRoutes = Router();
const db = new Db(mysql.createPool(vars.db));


/*
----------------        Start Get Routes        ----------------
*/
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

listRoutes.get('/list/:owner_username/:slug', async (req, res) =>  {
  const query = {'owner_username': req.params.owner_username, 'slug': req.params.slug}
  await db.findListFromSlug(query, (err, results) => {
    if (err) {
      return console.log(err);
    }
    return !results.length ? res.status(404).send('List Doesn\'t Exist.').end(): res.status(200).send(results).end();
  });
});
listRoutes.get('/list/:owner_username/:slug/items', async (req, res) =>  {
  const query = {'username': req.params.owner_username, 'slug': req.params.slug}
  await db.findListItems(query, (err, results) => {
    if (err) {
      console.log(err)
      return res.sendStatus(500).send(err.message).end();
    }
    return res.status(200).send(results).end();
  });
});
listRoutes.get('/list/:owner_username/:slug/comments', async (req, res) =>  {
  const query = {'list_owner_username': req.params.owner_username, 'slug': req.params.slug}
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
/*
--------------        End Get Routes        --------------
*/


/*
----------------        Start Creation Routes        ----------------
*/
// Handles List Creation...
listRoutes.post('/create-list', async (req, res) => {


  const id = Number(req.session.user[0].id);
  const username = req.session.user[0].username;
  const deadlineDate = new Date(req.body.deadline);
  const listPrivate = req.body.is_private === true ? 1 : 0;
  const listAllowsComments = req.body.allow_comments === true ? 1 : 0;
  const url = req.body.title.toLowerCase().split(' ').join('-');
  console.log(url);
  const list: List = {
    slug: url,
    name:  req.body.title,
    description: req.body.description,
    creation_date: new Date(),
    deadline: deadlineDate,
    isPrivate: listPrivate,
    allowComments: listAllowsComments,
    author_id: id
  }
  await db.createList(list, (err, results, _fields) => {
    if (err) {
      return res.status(400).send(err).end();
    } else {
      list
      return res.status(201).send({ message: 'List created.', url: `${username}/${list.slug}`})
    }
  });
})

// Handles List Item Creation...
/**
 * List Items Creation Conditions:
 *    - the current user must own the list
 *    - Fulfill the minimum character count
 */
listRoutes.post('/add-item', async (req, res) => {
  const deadlineDate = new Date(req.body.deadline);
  const id = Number(req.body.list_id);
  const listItem: ListItem = {
    item: req.body.item,
    deadline: deadlineDate || null,
    completed: 0,
    list_id: id
  }

  await db.addListItem(listItem, (err, results, _fields) => {
    if (err) {
      return res.status(400).send(err).end();
    }
    return res.status(201).send('List item added.')
  });
});

// Handles Comment Creation...
/**
 * Posting Condition for Comments:
 *    - User Must Be Logged In
 *    - Comment must be at least 160 characters long.
 *    - List must have comments enabled.
 */
listRoutes.post('/create-comment', async (req, res) => {
  let id;
  let parent
  let commentMessage;
  const currentDate = new Date();
  if (req.session.user[0].id !== undefined) {
    id = Number(req.session.user[0].id);
  }
  if (req.body.list_id !== undefined) {
    parent = Number(req.body.list_id);
  }
  if (req.body.comment !== undefined) {
    commentMessage = req.body.comment;
  }
  const listComment: ListComment = {
    author_id: id,
    comment_message: commentMessage,
    creation_date: currentDate,
    parent_id: parent
  }
  await db.findListFromID(listComment.parent_id, async (listErr, listResults, _listFields) => {
    if (listErr) {
      return res.status(400).send(listErr).end();
    }
    return listResults[0].allow_comments === 0 ? res.status(400).send('Comments are disabled').end() :
      await db.createListComments(listComment, (commentErr, _results, _fields) => {
        if (commentErr) {
          return res.status(400).send(commentErr).end();
        }
        const user = req.session.user[0];
        const commentData: ListCommentEmitter = {
          comment: listComment.comment_message,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          creation_date: listComment.creation_date,
        }
        emit(CommentEvents.CREATE_COMMENT, commentData)
        return res.status(201).send({message: 'Comment created.'}).end();
      })
    });
  });
/*
--------------        End Creation Routes        --------------
*/


/*
----------------        Start Deletion Routes        ----------------
*/
// Handles List Modification...
listRoutes.delete('/delete-list', async (_req, _res) => {
  console.log('delete list route');
})

// Handles List Item Modification...
listRoutes.delete('/delete-item', async (_req, _res) => {
  console.log('delete list item route');
})

// Handles Comment Modification...
listRoutes.delete('/delete-comment', async (_req, _res) => {
  console.log('delete comment route');
})
/*
--------------        End Deletion Routes        --------------
*/



/*
----------------        Start Update Routes        ----------------
*/
// Handles Comment Deletion
listRoutes.put('/update-list', async (_req, _res) => {
  console.log('update list route');
});
listRoutes.put('/update-item', async (_req, _res) => {
  console.log('update list item route');
});

listRoutes.put('/update-comment', async (_req, _res) => {
  console.log('update comment route');
});
/*
--------------        End Update Routes        --------------
*/



export default listRoutes;
