import {Router} from 'express';
import mysql from 'mysql';
import chalk from 'chalk';
import {Db} from '../database/db';
import {variables} from '../environments/variables';
import {comparePassword, hashPassword} from '../middleware/bcrypt';
import {User} from '../models/user';

const userRoutes = Router();
const  db = new Db(mysql.createPool(variables.db));

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
  const user: User = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    username: req.body.username,
    password: hashPassword(req.body.password)
  }
  return user.firstName === '' ? res.status(400).send({message: 'First Name is required'}).end() :
    user.username === '' ? res.status(400).send({message: 'Username is required'}).end() :
      user.email === '' ? res.status(400).send({message: 'Email is required'}).end() :
      req.params.password === '' ? res.status(400).send({message: 'Password is required'}).end() :
      await db.findUserFromUsername(user.username, (usernameErr, usernameRes) => {
        if (usernameErr) {
          console.error(chalk.red('Find by Username Error: ') + usernameErr.message);
          return res.status(500).send(usernameErr.message).end();
        }
        // Does username exist?
        if (usernameRes.length) {
          responseMessage.message = 'Username already exists';
          return res.status(401).send(responseMessage).end();
        }
        // If user doesn't exist Check for email.
        return db.findUserFromEmail(user.email, (emailErr, emailRes) => {
          if (emailErr) {
            console.error(chalk.red('Find by Email Error: ') + emailErr.message);
            return res.status(500).send(emailErr.message).end();
          }
          // Does email exist?
          if (emailRes.length) {
            responseMessage.message = 'Email Already exists';
            return res.status(401).send(responseMessage).end();
          }
          // if email doesn't exist create user
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
    return res.status(401).send(responseMessage).end();
  }
  if (password === '') {
    responseMessage.message = "Password is required.";
    return res.status(401).send(responseMessage).end();
  }
  await db.getPassword(username, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(403).send(err).end();
    } else {
      try {
        if (comparePassword(password, result[0].password) === false) {
          responseMessage.message = "Login Details Incorrect. Please Try Again.";
          return res.status(403).send(responseMessage).end();
        }
        db.findUserFromUsername(username, (error, results) => {
          if (error) {
            console.log(error);
            return res.status(403).send(error).end();
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

userRoutes.get('/session', (req, res) => {
  req.session.user ? res.status(200).send({authenticated: true, /*sessionData: req.session.user.map(result => {
      return {username: result.username, firstName: result.firstName, lastName: result.lastName};
    }), sessionID: req.session.id*/})
    : res.status(200).send({authenticated: false}).end();
});

export default userRoutes;
