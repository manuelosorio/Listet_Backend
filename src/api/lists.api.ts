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
listApi.post('/create-list', listController.post)
listApi.put('/update', listController.update);
listApi.delete('/delete-list/:id', listController.delete);
/********** Items *************/
listApi.get('/list/:slug/items', itemController.get);
listApi.post('/add-item', itemController.post);
listApi.delete('/delete-item/:id', itemController.delete);
listApi.put('/update-item-status', itemController.updateStatus);
listApi.put('/update-item', itemController.update);
/********** Comments **********/
listApi.get('/list/:slug/comments', commentController.get);
listApi.post('/create-comment', commentController.post);
listApi.put('/update-comment', commentController.update);
listApi.delete('/delete-comment/:id', commentController.delete);
export default listApi;
