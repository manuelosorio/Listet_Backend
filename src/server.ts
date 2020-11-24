import express from 'express';
import Flash from 'express-flash';
import userRoutes  from './routes/user';
import {variables} from './environments/variables';
import listRoutes from './routes/lists';
import environment from './environments/environment';
import { Mailer } from './middleware/nodemailer'
import {EmailData} from './models/email-data';
if (variables.nodeEnv === 'Production') {
  // tslint:disable-next-line:only-arrow-functions no-empty
  console.log = function() {
  }
}

const app = express();
const port = variables.port;
const mailer = new Mailer(variables.smtp);

app.use(environment);
app.use(Flash());
app.use(userRoutes);
app.use(listRoutes);

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

app.get('/test-email', (req, res) => {
  res.send('Test Email Route')
  const data: EmailData = {
    email: 'hey@manuelosorio.me',
    firstName: 'Manuel',
    lastName: 'Osorio',
    token: 'faketoken'
  }
  mailer.sendMail(variables.smtp.email, data, 'reset-password');

});
app.listen(port, err => {
  if (err) {
    throw err;
  }

  return console.log(`server is listening on ${port}`);
})

