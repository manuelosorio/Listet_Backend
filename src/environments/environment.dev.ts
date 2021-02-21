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
  resave: true,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false,
    maxAge: 2 * 60 * 60 * 1000
  },
}
dev.use(cors(vars.CORS));
dev.use(helmet());
dev.use(express.static('private'));
dev.use(morgan('tiny'));
dev.use(session(sess));

export = dev;
