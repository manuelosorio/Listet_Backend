import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import {variables} from './variables';

const dev = express();


/**
 *
 * TODO: Find out why I can't implement
 *       @types/express-mysql-session properly.
 *
 */
// tslint:disable-next-line:no-var-requires
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore(variables.db);

const sess = {
  name: variables.session_id,
  secret: variables.session_secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false,
    maxAge: 30 * 60 * 1000
  }
}
dev.use(cors({origin: [
      `http://${variables.app_url}`,
      `https://${variables.app_url}`,
      `http://${variables.app_url2}`,
      `https://${variables.app_url2}`,
      `http://localhost:4200`,
      `https://localhost:4200`,
      `http://localhost:4000`,
      `https://localhost:4000`
  ], credentials: true}));
dev.use(helmet());
dev.use(express.static('private'));
dev.use(morgan('combined'));
dev.use(session(sess));

export = dev;
