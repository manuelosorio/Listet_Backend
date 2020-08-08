import {Router} from 'express';
import mysql from 'mysql';
import chalk from 'chalk';
import {Db} from '../database/db';
import {variables} from '../environments/variables';
import {comparePassword, hashPassword} from '../middleware/bcrypt';
import {User} from '../models/user';

const userRoutes = Router();
const db = new Db(mysql.createPool(variables.db));

const responseMessage = {
  message: ''
};

// Display all users. Remove in preparation for production.
userRoutes.get('/users', async(req, res) => {
  await db.findAllUsers((err, results) => {
    if (err) {
      const errorMessage = `we failed to query users ${err}`;
      res.sendStatus(500).send(errorMessage)
      return errorMessage;
    }
    res.status(200).send(results).end();
    return results;
  });
});

userRoutes.get("/user/:username", async (req, res) => {
  const userName = req.params.username;
  await db.findUserFromUsername(userName, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(403).send(err).end()
    }
    return res.status(200).send(results).end();
  })
})

userRoutes.post('/register', async (req, res) => {
  console.log('new user');
  const user: User = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    username: req.body.username,
    password: hashPassword(req.body.password)
  }
  // TODO: find a better way to test if email, username or password before attempting to create a new user.
  return user.firstName === '' ? res.status(400).send('First Name is required').end() :
      user.username === '' ? res.status(400).send('Username is required').end() :
      user.email === '' ? res.status(400).send('Email is required').end() :
      req.params.password === '' ? res.status(400).send('Password is required').end() :
      await db.findUserFromUsername(user.username, (usernameErr, usernameRes) => {
        if (usernameErr) {
          console.error(chalk.red('Find by Username Error: ') + usernameErr.message);
          return res.status(500).send(usernameErr.message).end();
        }
        if (!usernameRes.length) {
          return db.findUserFromEmail(user.email, (emailErr, emailRes) => {
            if (emailErr) {
              console.error(chalk.red('Find by Email Error: ') + emailErr.message);
              return res.status(500).send(emailErr.message).end();
            }
            if (!emailRes.length) {
              db.newUser(user, (err, results) => {
                if (err) {
                  return err;
                }
                responseMessage.message = 'User Created Successfully';
                return res.status(201).send(responseMessage).end();
              });
            }
            responseMessage.message = 'Email Already exists';
            return res.status(401).send(responseMessage).end();
          })
        }
        responseMessage.message = 'Username already exists';
        return res.status(401).send(responseMessage).end();
      })
});

userRoutes.post('/login', async (req, res) => {
  const username: string = req.body.username;
  const password: string = req.body.password;
  if (username === '') {
    return console.error("Username is required.");
  }
  if (password === '') {
    return console.error("Password is required.");
  }
  await db.getPassword(username, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(403).send(err).end();
    } else {
      try {
        if (comparePassword(password, result[0].password) === false) {
          return res.status(403).send("Username or Password doesn't match!").end();
        } else {
          db.findUserFromUsername(username, (error, results) => {
            if (error) {
              console.log(error);
              return res.status(403).send(error).end();
            }
            db.userSession(req, results);
            responseMessage.message = 'Login Successful';
            return res.status(200).send(responseMessage).end();
          });
        }
      } catch (e) {
        return e;
      }
    }
  })
});

userRoutes.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    err ? res.status(500).send('Could not logout.') :
      res.status(200).send({});
  })
});

userRoutes.get('/session', (req, res) => {
  req.session.user ? res.status(200).send({authenticated: true, /*sessionData: req.session.user.map(result => {
      return {username: result.username, firstName: result.firstName, lastName: result.lastName};
    }), sessionID: req.session.id*/})
    : res.status(200).send({authenticated: false});
});

export default userRoutes;
