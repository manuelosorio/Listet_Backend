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

const userRoutes = Router();
const db = new Db(mysql.createPool(vars.db));
const mailer = new Mailer(vars.smtp)
const crypto = new Crypto();
const responseMessage = {
  message: ''
};

// Display all users. Remove in preparation for production.
userRoutes.get('/users', async(req, res) => {
    switch (vars.variables.nodeEnv) {
      case 'Development':
      case 'development':
        await db.findAllUsers((err, results) => {
          if (err) {
            const errorMessage = `we failed to query users ${err}`;
            return res.sendStatus(500).send(errorMessage).end();
          }
          return res.status(200).send(results).end();
        });
        break;
      case 'Production':
      case 'production':
        res.status(200).send([{
          "username": "ForSecurityPurposes",
          "firstName": "Users are not",
          "lastName": "Shown in production"
        }]).end();
        break;
    }
});

userRoutes.get("/user/:username", async (req, res) => {
  const userName = req.params.username;
  await db.findUserFromUsername(userName, (err, results) => {
    return err ? res.status(403).send(err).end() :
      !results.length ? res.status(404).send({message: 'User does not exist'}).end() : res.status(200).send(results).end();
  });
});

userRoutes.post('/register', async (req, res) => {
  const date = new DateUtil(new Date());
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
            return db.newUser(user, (err, _results) => {
              if (err) {
                return err;
              }
              const num = parseInt(vars.token.verify_expire_time, 0);
              const expireDate = date.setExpire(num);
              console.log(expireDate);
              const data: object = {
                expires: expireDate,
                email: req.body.email
              };
              const tokenStore = crypto.generateString();
              const encryptedToken = crypto.createToken(JSON.stringify(data));
              const emailData: EmailData = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                token: 'https://' + vars.smtp.host + vars.app.path + '/verify-account/' + tokenStore
              }
              const queryParams = {
                token: tokenStore,
                email: req.body.email
              }

              return db.verifyAccountToken(queryParams, (tokenErr, _tokenResults) => {
                if (tokenErr) {
                  console.error(chalk.bgRed.white(tokenErr))
                  return res.status(500).send(tokenErr).end();
                }
                return db.verifyAccountTokenStore([tokenStore, expireDate.getTime(),encryptedToken], (tokenStoreErr, _tokenStoreResults) => {
                  if (tokenStoreErr) {
                    console.error(chalk.bgRed.white(tokenStoreErr))
                    return res.status(500).send(tokenStoreErr).end();
                  }
                  responseMessage.message = 'User Created Successfully';
                  mailer.sendMail(vars.smtp.email, emailData, 'verify-email');
                  return res.status(200).send(responseMessage).end()
                });
              });
            });
          });
        });
});

userRoutes.post('/login', async (req, res) => {
  const email: string = req.body.email;
  const password: string = req.body.password;
  if (email === '') {
    responseMessage.message = "Email is required.";
    return res.status(409).send(responseMessage).end();
  }
  if (password === '') {
    responseMessage.message = "Password is required.";
    return res.status(409).send(responseMessage).end();
  }
  await db.getPassword(email, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err).end();
    } else {
      try {
        if (comparePassword(password, result[0].password) === false) {
          responseMessage.message = "Login Details Incorrect. Please Try Again.";
          return res.status(403).send(responseMessage).end();
        }
        return db.findUserFromEmail(email, (error, results) => {
          if (error) {
            return res.status(500).send(error).end();
          }
          console.log('login: ', chalk.bgYellow.white(results))
          db.userSession(req, results);
          responseMessage.message = 'Login Successful';
          return res.status(200).send(responseMessage).end();
        });
      } catch (e) {
        console.log(e);
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
      const num = parseInt(vars.token.reset_expire_time, 0);
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
        token: 'https://' + vars.smtp.host + vars.app.path + '/reset-password/' + tokenStore
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
          responseMessage.message = "If an account with the email address exists, an email has been sent containing further instructions. If you can't find it, try checking your junk folder."
          return res.status(200).send(responseMessage).end()
        });
      })
    }
  })
});

userRoutes.get('/session', (req, res) => {

  if (!req.session.user) {
    return res.status(200).send({authenticated: false}).end();
  }
  const sessionData = req.session.user.map(result => {
    return {verified: result.verification_status === 1}
  });
  res.status(200).send({ authenticated: true, verified: sessionData[0].verified });
});
export default userRoutes;
