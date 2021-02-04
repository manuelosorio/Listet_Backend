import express from 'express';
import session, { SessionOptions } from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import * as vars from './variables';

const dev = express();


/**
 *
 * TODO: Find out why I can't implement
 *       @types/express-mysql-session properly.
 *
 */
// tslint:disable-next-line:no-var-requires
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore(vars.db);

const sess: SessionOptions = {
  name: vars.session.id,
  secret: vars.session.secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false,
    maxAge: 2 * 60 * 60 * 1000
  },
}
dev.use(cors({origin: [
      `http://${vars.app.url}`,
      `https://${vars.app.url}`,
      `http://${vars.app.url2}`,
      `https://${vars.app.url2}`,
      `http://localhost:4200`,
      `https://localhost:4200`,
      `http://localhost:4000`,
      `https://localhost:4000`
  ], credentials: true}));
dev.use(helmet());
dev.use(express.static('private'));
dev.use(morgan('tiny'));
dev.use(session(sess));

export = dev;
