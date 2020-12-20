import express from 'express';
import Flash from 'express-flash';
import userRoutes  from './routes/user';
import {variables} from './environments/variables';
import listRoutes from './routes/lists';
import environment from './environments/environment';
import tokens from './routes/tokens';

if (variables.nodeEnv === 'Production') {
  // tslint:disable-next-line:only-arrow-functions no-empty
  console.log = function() {
  }
}

const app = express();
const port = variables.port;

app.use(environment);
app.use(Flash());
app.use(userRoutes);
app.use(listRoutes);
app.use(tokens);

// TODO: Delete functions for default path
app.get('/', (req, res) => {
  if (!req.session) {
    return res.send('There is no session')
  }
  if (!req.session.user) {
    return res.send('You are not logged in')
  } else {
    const user = req.session.user.map(result => {
      return {firstName: result.firstName, lastName: result.lastName};
    });
    const firstName = user[0].firstName;
    const lastName = user[0].lastName
    return res.send(`Hello ${firstName} ${lastName}`);
  }
});

app.listen(port, err => {
  if (err) {
    throw err;
  }

  return console.log(`server is listening on ${port}`);
})

