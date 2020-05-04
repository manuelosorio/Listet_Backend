import Router from 'express';
import db from '../database/db';

const userRoutes = Router();
const connection = db;
const users = "SELECT * FROM users";
const individualUser = "SELECT * FROM users WHERE username = ?";

userRoutes.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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

export default userRoutes;
