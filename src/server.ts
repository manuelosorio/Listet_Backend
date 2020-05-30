import helmet from 'helmet';
import express from 'express';
const app = express();

import Flash from 'express-flash';
import userRoutes  from './routes/user';
import {variables} from './environments/variables';
import listRoutes from './routes/lists';
import environment from './environments/environment';



const port = variables.port;


app.use(environment);
app.use(Flash());
app.use(userRoutes);
app.use(listRoutes);
// app.use(express.static('private'));

app.get('/', (req, res) => {
  if (!req.session) {
    return res.send('There is no session')
  }
  if (!req.session.user) {
    return res.send('You are not logged in')
  } else {
    const firstName = req.session.user.firstName
    const lastName = req.session.user.lastName
    return res.send(`Hello ${firstName} ${lastName}`);
  }
});

app.listen(port, err => {
  if (err) {
    throw err;
  }

  return console.log(`server is listening on ${port}`);
})

