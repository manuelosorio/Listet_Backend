import Router from 'express';
import db from '../database/db';
import bodyParser from 'body-parser';
import {variables} from '../environments/variables';
import {comparePassword, hashPassword} from '../middleware/bcrypt';
import Bcrypt from 'bcrypt';

const userRoutes = Router();
const connection = db;
const users = "SELECT * FROM users";
const individualUser = "SELECT * FROM users WHERE username = ?";

userRoutes.use(bodyParser.json());
userRoutes.use(bodyParser.urlencoded({extended: false}))


userRoutes.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
userRoutes.get('/users', (req, res) => {
  connection.query(users, (err, results, fields) => {
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
})
userRoutes.get('/users/:username', (req, res, next) => {
  const userName = req.params.username;
  console.log("username: " + userName);
  res.status(302);
  connection.query(individualUser, [userName], (err, results, fields) => {
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
})

userRoutes.post('/new/user', (req, res, next) => {
  console.log('new user');
  const firstName: string = req.body.firstName;
  const lastName: string = req.body.lastName;
  const email: string = req.body.email;
  const username: string = req.body.username;
  const password: any = hashPassword(req.body.password);


  connection.query(variables.postQuery, [firstName, lastName, email, username, password, 0, 0],
    (err, results, fields) => {
      if (err) {
        console.log(req);
        throw err.message;
        res.sendStatus(500);
        return;
      }
      res.end();
    });
});
userRoutes.post('/login', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  connection.query("SELECT \`password\` FROM users WHERE username=" + `\"${username}\"`, (err, results) => {
    if(err) throw err;
    const hash = results.map((result) => {
      return result.password;
    });
    comparePassword(password, hash[0]);
  })
});


export default userRoutes;
