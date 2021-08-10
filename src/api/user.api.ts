import { Router } from 'express';
import { UserController } from '../controllers/user/user.controller';
import {
  containsFirstName,
  containsLastName,
  containsUsername, containsEmail,
  isEmailValid,
  isPasswordValid,
} from '../middleware/registration.middleware';
import { containsPassword, isAuth } from '../middleware/auth.middleware';
import { matchesAccountPassword } from '../middleware/password.middleware';

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

userApi.put('/update-password', isAuth, matchesAccountPassword, userController.changePassword);
userApi.put('/update-account-info', isAuth, userController.updateAccountInfo);
userApi.put('/deactivate-account', isAuth, userController.deactivateUser);
userApi.put('/reactivate-account', isAuth, userController.reactivateUser);


export default userApi;
