import {Router} from 'express';
import bodyParser from 'body-parser';

import {Db} from '../database/db';
import {variables} from '../environments/variables';
import {comparePassword, hashPassword} from '../middleware/bcrypt';
import {User} from '../models/user'
import mysql from 'mysql';
const userRoutes = Router();
const db = new Db(mysql.createPool(variables.db));
const connection = db.getConnection();
const users = "SELECT * FROM users";

userRoutes.use(bodyParser.json());
userRoutes.use(bodyParser.urlencoded({extended: false}))

// Display all users. Remove in preparation for production.
userRoutes.get('/users', async(req, res) => {
  await db.findAllUsers((err, results) => {
    if (err) {
      const errorMessage = `we failed to query users ${err}`;
      res.sendStatus(500)
      return errorMessage;
    }
    res.status(200).send(results).end();
    return users;
  });
});

userRoutes.get("/user/:username", async (req, res) => {
  const userName = req.params.username;
  await db.findUserFromUsername(userName, (err, results) => {
    if (err) {console.log(err);return res.status(403).send(err).end()};
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
  await db.newUser(user, (err, next) => {
    return console.log(next);
  });
});

userRoutes.post('/login', async (req, res) => {
  const username: string = req.body.username;
  const password: string = req.body.password;
  if (username === '') {
    // res.redirect("/login");
    return console.error("Username is required.");
  }
  if (password === '') {
    // res.redirect("/login.html");
    return console.error("Password is required.");
  }
  const dbPassword = await db.getPassword(username, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(403).send(err).end()
    } else {
      if (comparePassword(password, result[0].password) === false) {
        res.status(403).send("Username or Password doesn't match!").end();
      }
      db.findUserFromUsername(username, (error, results) => {
        if (error) {
          console.log(error);
          return res.status(403).send(error).end();
        }
        console.log(results)
        res.send(db.userSession(req, results))
      });
    }
  })
  console.log(dbPassword)
});

userRoutes.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    err ? res.status(500).send('Could not logout.') :
      res.status(200).send({});
  })
});

userRoutes.get('/session', (req, res) => {
  req.session.user ? res.status(200).send({authenticated: true})
    : res.status(200).send({authenticated: false});
})

export default userRoutes;
