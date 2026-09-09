import { Router } from 'express';
import { UserController } from '#controllers/user/user.controller';
import {
  containsFirstName,
  containsLastName,
  containsUsername,
  containsEmail,
  isEmailValid,
  isPasswordValid,
} from '#middleware/registration.middleware';
import { containsPassword, isAuth } from '#middleware/auth.middleware';
import {
  containsNewPassword,
  matchesAccountPassword,
} from '#middleware/password.middleware';
import {
  authApiLimiter,
  emailApiLimiter,
  globalRegistrationApiLimiter,
  ipApiLimiter,
  passwordResetApiLimiter,
  registrationApiLimiter,
  registrationDailyApiLimiter,
} from '#middleware/rate-limit.middleware';

const userApi = Router();
const userController = new UserController();

userApi.get('/user/:username', userController.getUser);

userApi.post(
  '/register',
  globalRegistrationApiLimiter,
  registrationApiLimiter,
  registrationDailyApiLimiter,
  containsFirstName,
  containsLastName,
  containsUsername,
  containsEmail,
  isEmailValid,
  isPasswordValid,
  emailApiLimiter,
  userController.register
);
userApi.post(
  '/login',
  authApiLimiter,
  containsEmail,
  containsPassword,
  userController.login
);
userApi.post('/logout', userController.logout);
userApi.post(
  '/reset-password',
  passwordResetApiLimiter,
  containsEmail,
  isEmailValid,
  emailApiLimiter,
  userController.resetPassword
);
userApi.get('/session', userController.session);

userApi.put(
  '/update-password',
  ipApiLimiter,
  isAuth,
  containsNewPassword,
  containsPassword,
  matchesAccountPassword,
  userController.changePassword
);
userApi.put(
  '/update-account-info',
  isAuth,
  containsFirstName,
  containsLastName,
  containsEmail,
  isEmailValid,
  userController.updateAccountInfo
);
userApi.put(
  '/deactivate-account',
  ipApiLimiter,
  isAuth,
  containsPassword,
  matchesAccountPassword,
  userController.deactivateUser
);

userApi.put(
  '/reactivate-account',
  ipApiLimiter,
  isAuth,
  containsPassword,
  matchesAccountPassword,
  userController.reactivateUser
);

userApi.delete(
  '/delete-account',
  ipApiLimiter,
  isAuth,
  containsPassword,
  matchesAccountPassword,
  userController.deleteUser
);

export default userApi;
