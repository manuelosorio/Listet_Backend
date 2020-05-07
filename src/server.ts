import express from 'express';
import userRoutes  from './routes/user';
import {variables} from './environments/variables';
import environment from './environments/environment';
import listRoutes from './routes/lists';

const app = express();
const port = variables.port;

app.use(environment);
app.use(userRoutes);
app.use(listRoutes);

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, err => {
  if (err) {
    throw err;
  }
  return console.log(`server is listening on ${port}`);
})

