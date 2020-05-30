import {Router} from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';

import {Db} from '../database/db';
import {variables} from '../environments/variables';
import {comparePassword, hashPassword} from '../middleware/bcrypt';

const userRoutes = Router();
const connection = Db.getConnection();
const users = "SELECT * FROM users";
const individualUser = "SELECT * FROM users WHERE username = ?";

userRoutes.use(bodyParser.json());
userRoutes.use(bodyParser.urlencoded({extended: false}))

// Display all users. Remove in preparation for production.
userRoutes.get('/users', (req, res) => {
  connection.query(users, (err, results) => {
    const errorMessage = `we failed to query users ${err}`;
    if (err) {
      res.sendStatus(500)
      throw errorMessage;
    }
    const allUsers = results.map((result) => {
      return {firstName: result.firstName, lastName: result.lastName, username: result.username}
    })
    res.json(allUsers);
    return users;
  });
});

userRoutes.get('/users/:username', (req, res) => {
  const userName = req.params.username;
  console.log("username: " + userName);
  res.status(302);
  connection.query(individualUser, [userName], (err, results, ) => {
    const errorMessage = `we failed to query user ${err}`;
    if (err) {
      res.sendStatus(500)
      throw errorMessage;
    }
    const user = results.map((result) => {
      return {firstName: result.firstName, lastName: result.lastName, username: result.username}
    })
    res.json(user);
    return user;
  })
});
userRoutes.post('/register', (req, res) => {
  console.log('new user');
  const firstName: string = req.body.firstName;
  const lastName: string = req.body.lastName;
  const email: string = req.body.email;
  const username: string = req.body.username;
  const password: any = hashPassword(req.body.password);
  connection.query(variables.postQuery, [firstName, lastName, email, username, password, 0, 0],
    (err) => {
      if (err) {
        console.log(req);
        throw err.message;
      }
      res.end();
    });
});
userRoutes.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username === '') {
    // res.redirect("/login.html");
    return console.error("Username is required.");
  }
  if (password === '') {
    // res.redirect("/login.html");
    return console.error("Password is required.");
  }
  const passwordQuery = "SELECT id, username, password, firstName, lastName FROM users WHERE username=" + `\"${username}\"`;
    connection.query(passwordQuery, (err, results) => {
      if (err) return err;
      const hash = results.map((result) => {
        return result.password;
      });
      const userData = results.map((result) => {
        return {
          username: result.username,
          firstName: result.firstName,
          lastName: result.lastName
        }
      });
      try {
        if (comparePassword(password, hash[0]) === false) {
          res.status(403).send("Username or Password doesn't match!").end();
        } else {
          res.send(userSession(userData[0]))
        }
      } catch (e) {
        res.status(403).send('Username or Password doesn\'t match!').end()
      }
    })
  const userSession = (sessionData: object) => {
    return req.session.user = sessionData;
  };
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
