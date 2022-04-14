import express from 'express';
import Flash from 'express-flash';
import http from 'http';
import helmet from 'helmet';
import environment from './environments/environment';
import { variables } from './environments/variables';
import listApi from './api/lists.api';
import tokensApi from './api/tokens.api';
import userApi from './api/user.api';
import searchApi from './api/search.api';
import { Sockets } from './utilities/sockets';


if (variables.nodeEnv === 'production') {
  console.log = () => {return}
}
const app = express();

const server = new http.Server(app);

app.set('port', variables.port || 3000);
app.use(helmet());
app.use(express.json())
app.use(environment);
app.use(Flash());
app.use(userApi);
app.use(listApi);
app.use(tokensApi);
app.use('/search', searchApi);


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
