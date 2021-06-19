import { Router } from 'express';
import { ItemController } from '../controllers/list/item/item.controller';
import { CommentController } from '../controllers/list/comment/comment.controller';
import { ListController } from '../controllers/list/list.controller';
import { isAuth, isVerified } from '../middleware/auth.middleware';
import { checkListTitle, isItemEmpty, isListItemOwner, isListOwner } from '../middleware/list.middleware';
import { canDeleteComment, isCommentBodyEmpty, isCommentOwner } from '../middleware/comment.middleware';

const listApi = Router();
const listController = new ListController();
const itemController= new ItemController();
const commentController = new CommentController();


/********** List **************/
listApi.get('/lists', listController.getAll);
listApi.get('/your-lists', isAuth, listController.getAuthUserLists)
listApi.get('/list/:slug', listController.getSingle);
listApi.post('/create-list', isAuth, isVerified, checkListTitle, listController.post)
listApi.put('/update-list/:id', isAuth, isListOwner, checkListTitle, listController.update);
listApi.delete('/delete-list/:id', isAuth, isListOwner, listController.delete);
/********** Items *************/
listApi.get('/list/:slug/items', itemController.get);
listApi.post('/add-item', isAuth, isListOwner, isItemEmpty, itemController.post);
listApi.delete('/delete-item/:id', isAuth, isListItemOwner, itemController.delete);
listApi.put('/update-item-status', isAuth, isListOwner, itemController.updateStatus);
listApi.put('/update-item/:id', isAuth, isListOwner, isItemEmpty, itemController.update);
/********** Comments **********/
listApi.get('/list/:slug/comments', commentController.get);
listApi.post('/create-comment', isAuth, isCommentBodyEmpty, commentController.post);
listApi.put('/update-comment/:id', isAuth, isCommentOwner, commentController.update);
listApi.delete('/delete-comment/:id', isAuth, canDeleteComment,commentController.delete);
export default listApi;
