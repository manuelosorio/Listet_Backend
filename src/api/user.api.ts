import { Router } from 'express';
import { UserController } from '../controllers/user/user.controller';
import {
  containsFirstName,
  containsLastName,
  containsUsername, containsEmail,
  isEmailValid,
  isPasswordValid,
} from '../middleware/registration.middleware';
import { containsPassword } from '../middleware/auth.middleware';

const userApi = Router();
const userController = new UserController()

userApi.get('/users', userController.getAllUsers);
userApi.get('/user/:username', userController.getUser);

userApi.post('/register', containsFirstName,
  containsLastName, containsUsername, containsEmail,
  isEmailValid, isPasswordValid, userController.register);

userApi.post('/login', containsEmail, containsPassword, userController.login);
userApi.post('/logout', userController.logout);
userApi.post('/reset-password', containsEmail, userController.resetPassword);
userApi.get('/session', userController.session);

export default userApi;
