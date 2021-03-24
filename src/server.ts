import express from 'express';
import Flash from 'express-flash';
import http from 'http';
import userRoutes  from './api/user';
import { variables } from './environments/variables';
import listRoutes from './api/lists';
import environment from './environments/environment';
import tokensApi from './api/tokens';
import { Sockets } from "./utilities/sockets";


if (variables.nodeEnv === 'production') {
  console.log = () => {return}
}
const app = express();
const server = new http.Server(app);

app.set('port', variables.port || 3000);
app.use(environment);
app.use(Flash());
app.use(userRoutes);
app.use(listRoutes);
app.use(tokensApi);


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


new Sockets(server).connect();
server.listen(app.get('port'), () => {
  console.log('Server listening on port ' + app.get('port'));
});
