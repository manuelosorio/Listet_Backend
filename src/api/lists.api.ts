import { Router } from 'express';
import { ItemController } from '../controllers/list/item/item.controller';
import { CommentController } from '../controllers/list/comment/comment.controller';
import { ListController } from '../controllers/list/list.controller';

const listApi = Router();
const listController = new ListController();
const itemController= new ItemController();
const commentController = new CommentController();


/********** List **************/
listApi.get('/lists', listController.getAll);
listApi.get('/list/:slug', listController.getSingle);
listApi.post('/create-list', checkListTitle, listController.post)
listApi.put('/update-list/:id', checkListTitle, listController.update);
listApi.delete('/delete-list/:id', listController.delete);
/********** Items *************/
listApi.get('/list/:slug/items', itemController.get);
listApi.post('/add-item', itemController.post);
listApi.delete('/delete-item/:id', isAuthed, itemController.delete);
listApi.put('/update-item-status', itemController.updateStatus);
listApi.put('/update-item/:id', itemController.update);
/********** Comments **********/
listApi.get('/list/:slug/comments', commentController.get);
listApi.post('/create-comment', commentController.post);
listApi.put('/update-comment/:id', commentController.update);
listApi.delete('/delete-comment/:id', commentController.delete);
export default listApi;

function isAuthed(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(403).send({message: 'You must be authenticated to complete that action.'})
}
function checkListTitle(req, res, next) {
  console.log(req.body.title.length)
  if (req.body.title.length > 0) {
    return next();
  }
  return res.status(400).send({ message: "Title can't be empty"})
}
