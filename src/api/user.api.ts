import {Router} from 'express';
import { UserController } from '../controllers/user/user.controller';

const userApi = Router();
const userController = new UserController()

userApi.get('/users', userController.getAllUsers);
userApi.get('/user/:username', userController.getUser);
userApi.post('/register', userController.register);
userApi.post('/login', userController.login);
userApi.post('/logout', userController.logout);
userApi.post('/reset-password', userController.resetPassword);
userApi.get('/session', userController.session);

export default userApi;
