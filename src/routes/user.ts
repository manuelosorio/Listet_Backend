import {Router} from 'express';
import mysql from 'mysql';
import chalk from 'chalk';
import {Db} from '../database/db';
import * as vars from '../environments/variables';
import {comparePassword, hashPassword} from '../middleware/bcrypt';
import {User} from '../models/user';
import {Crypto} from '../middleware/crypto';
import {DateUtil} from '../middleware/date';
import {Mailer} from '../middleware/nodemailer';
import {EmailData} from '../models/email-data';
import {ResetPassword} from '../models/reset-password';

const userRoutes = Router();
const db = new Db(mysql.createPool(vars.variables.db));
const mailer = new Mailer(vars.smtp)
const crypto = new Crypto();
const responseMessage = {
  message: ''
};

// Display all users. Remove in preparation for production.
userRoutes.get('/users', async(req, res) => {
  await db.findAllUsers((err, results) => {
    if (err) {
      const errorMessage = `we failed to query users ${err}`;
      return res.sendStatus(500).send(errorMessage).end();
    }
    return res.status(200).send(results).end();
  });
});

userRoutes.get("/user/:username", async (req, res) => {
  const userName = req.params.username;
  await db.findUserFromUsername(userName, (err, results) => {
    return err ? res.status(403).send(err).end() :
      !results.length ? res.status(404).send({message: 'User does not exist'}).end() : res.status(200).send(results).end();
  });
});

userRoutes.post('/register', async (req, res) => {
  console.log('new user');
  return req.body.firstName === '' ? res.status(409).send({message: 'First Name is required'}).end() :
    req.body.username === '' ? res.status(409).send({message: 'Username is required'}).end() :
    !req.body.username.match(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/) ? res.status(400).send({ message: '' }).end() :
      req.body.email === '' ? res.status(409).send({ message: 'Email is required' }).end() :
      !req.body.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,4}$/) ? res.status(400).send({ message: 'Email is invalid' }).end() :
        req.body.password === '' ? res.status(409).send({message: 'Password is required'}).end() :
        !req.body.password.match(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@$!%*#?&])([a-zA-Z0-9\d@$!%*#?&]+){8,}/) ? res.status(409).send({ message: 'passwords must be at least 8 characters long, contain 1 capital letter, a special character (@ $ ! % * # ? &), and at least one number.' }).end() :
        await db.findUserFromUsername(req.body.username, (usernameErr, usernameRes) => {
          if (usernameErr) {
            return res.status(500).send({message: usernameErr.message}).end();
          }
          // Does username exist?
          if (usernameRes.length) {
            responseMessage.message = 'Username already exists';
            return res.status(401).send(responseMessage).end();
          }
          // If user doesn't exist Check for email.
          return db.findUserFromEmail(req.body.email, (emailErr, emailRes) => {
            if (emailErr) {
              console.error(chalk.red('Find by Email Error: ') + emailErr.message);
              return res.status(500).send(emailErr.message).end();
            }
            // Does email exist?
            if (emailRes.length) {
              return res.status(401).send({ message: 'Email Already exists' }).end();
            }
            // if email doesn't exist create user
            const user: User = {
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              email: req.body.email.toLowerCase(),
              username: req.body.username.toLowerCase(),
              password: hashPassword(req.body.password)
            }
            db.newUser(user, (err, _results) => {
              if (err) {
                return err;
              }
              responseMessage.message = 'User Created Successfully';
              return res.status(201).send(responseMessage).end();
            });
          })
        })
});

userRoutes.post('/login', async (req, res) => {
  const username: string = req.body.username;
  const password: string = req.body.password;
  if (username === '') {
    responseMessage.message = "Username is required.";
    return res.status(409).send(responseMessage).end();
  }
  if (password === '') {
    responseMessage.message = "Password is required.";
    return res.status(409).send(responseMessage).end();
  }
  await db.getPassword(username, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err).end();
    } else {
      try {
        if (comparePassword(password, result[0].password) === false) {
          responseMessage.message = "Login Details Incorrect. Please Try Again.";
          return res.status(403).send(responseMessage).end();
        }
        db.findUserFromUsername(username, (error, results) => {
          if (error) {
            return res.status(500).send(error).end();
          }
          db.userSession(req, results);
          responseMessage.message = 'Login Successful';
          return res.status(200).send(responseMessage).end();
        });
      } catch (e) {
        return e;
      }
    }
  })
});

userRoutes.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    err ? res.status(500).send({message: 'Could not logout.'}).end() :
      res.status(200).send({}).end();
  })
});

userRoutes.post('/reset-password', async (req, res) => {
  await db.findUserFromEmail(req.body.email, (err, results) => {
    if (err) {
      return res.status(500).send(err).end();
    }
    const date = new DateUtil(new Date());
    if (results.length) {
      const num = parseInt(vars.token.expire_time, 0);
      const expireDate = date.setExpire(num);
      const data: object = {
        expires: expireDate,
        email: req.body.email
      };
      const tokenStore = crypto.generateString();
      const encryptedToken = crypto.createToken(JSON.stringify(data));
      const emailData: EmailData = {
        firstName: results[0].firstName,
        lastName: results[0].lastName,
        email: results[0].email,
        token: 'https://' + vars.variables.app_url + '/reset-password/' + tokenStore
      }
      const queryParams = {
        token: tokenStore,
        id: results[0].id
      }

      db.resetPasswordToken(queryParams, (tokenErr, _results) => {
        if (tokenErr) {
          return res.status(500).send(tokenErr).end();
        }
        return db.resetPasswordTokenStore([tokenStore, expireDate.getTime(),encryptedToken], (tokenStoreErr, _tokenResults) => {
          if (tokenStoreErr) {
            return res.status(500).send(tokenStoreErr).end();
          }
          mailer.sendMail(vars.smtp.email, emailData, 'reset-password');
          return res.status(200).send({message: 'If an account with the email address exists, an email has been sent containing further instructions. If you can\'t find it, try checking your junk folder.'}).end()
        });
      })
    }
  })
});

userRoutes.get('/reset-password/:tokenStore', (req, res) => {
  const tokenStore = req.params.tokenStore;
  db.userResetPasswordToken([tokenStore], (err, results) => {
    if (err) {
      return res.status(500).send(err).end();
    }
    return !results.length ?
      res.status(401).send("Token doesn't exist or has expired.")
      : db.getResetPasswordTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
        if (tokenErr) {
          return res.status(500).send(tokenErr).end();
        }
        const expires = tokenResults.map(result => {
          return result.expires;
        })[0];
        const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
        return isExpired === true ? res.status(401).send({message: "Token doesn't exist or has expired."}) : res.status(200).send({expired: false}).end();
      })
  })
});

userRoutes.put('/reset-password/:tokenStore', (req, res) => {
  const tokenStore = req.params.tokenStore
  const password = req.body.password;
  let newPassword: string;
  if (password === '') {
    responseMessage.message = "Password is required.";
    return res.status(409).send(responseMessage).end();
  } else {
    newPassword = hashPassword(password);
  }
  db.getResetPasswordTokenStore([tokenStore], (err, results) => {
    if (err) {
      return res.status(500).send(err).end();
    }
    if (!results.length) {
      return res.status(401).send('Token doesn\'t exist or has expired. 1');
    }
    const userEmail = results.map(result => {
      return crypto.decipher(result.data).email;
    })[0];
    console.log(userEmail);
    return db.getResetPasswordTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
      if (tokenErr) {
        return res.status(500).send(tokenErr).end();
      }
      const expires = tokenResults.map(result => {
        return result.expires;
      })[0];
      console.log('time', expires)
      const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
      const data: ResetPassword = {email: userEmail, password: newPassword, token: tokenStore};
      console.log('expired', isExpired)
      if (isExpired) {
        return res.status(401).send({
          message: "Token doesn't exist or has expired. 2"
        });
      } else {
        return db.deleteResetTokenStore(tokenStore, (deleteStoreErr, _) =>{
          if(deleteStoreErr) return res.send(deleteStoreErr)
          return db.resetPassword(data, (resetPasswordErr, _resetPasswordResults) => {
            if (resetPasswordErr) {
              console.log(resetPasswordErr)
              return res.status(401).send(resetPasswordErr).end();
            }
            return res.status(200).send({message: 'Password has been reset.'}).end();
          });
        });
      }
    })
  });
});
userRoutes.get('/session', (req, res) => {
  req.session.user ? res.status(200).send({authenticated: true, /*sessionData: req.session.user.map(result => {
      return {username: result.username, firstName: result.firstName, lastName: result.lastName};
    }), sessionID: req.session.id*/})
    : res.status(200).send({authenticated: false}).end();
});
export default userRoutes;
