import express from 'express';
import Flash from 'express-flash';
import userRoutes  from './routes/user';
import {variables, CORS} from './environments/variables';
import listRoutes from './routes/lists';
import environment from './environments/environment';
import tokens from './routes/tokens';
import {WebsocketEvents} from './events/websocket-events';
import SocketIO from 'socket.io';


if (variables.nodeEnv === 'production') {
  console.log = () => {return}
}
const app = express();
const port = variables.port;

app.use(environment);
app.use(Flash());
app.use(userRoutes);
app.use(listRoutes);
app.use(tokens);
const server = app.listen(port, err => {
  if (err) {
    throw err;
  }
  return console.log(`server is listening on ${port}`);
});

const io = new SocketIO.Server(server, ({
  cors: CORS
}));

io.on(WebsocketEvents.CONNECT, (socket) => {
  console.log('Client Connected');

  socket.on(WebsocketEvents.CREATE_COMMENT, res => {
    console.log(JSON.stringify({commentData: res}));
    socket.broadcast.emit(WebsocketEvents.CREATE_COMMENT, res);
    socket.emit(WebsocketEvents.CREATE_COMMENT, res);
  })
})
io.on('disconnect', reason => {
  console.log('Client Disconnected:', reason)
})
console.log('Websocket Initialized!');


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
