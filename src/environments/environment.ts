import express from 'express';
import session, { SessionOptions } from 'express-session';
import * as expressSession from 'express-session';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import MySQLSession from 'express-mysql-session';
import * as vars from './variables';

const isProd = vars.variables.nodeEnv === 'production';

const MySQLStore = MySQLSession(expressSession);
const sessionStore = new MySQLStore(vars.DB_CONFIG);

const environment = express();

environment.use(morgan(isProd ? 'combined' : 'tiny'));
environment.use(cors(vars.CORS));

const sess: SessionOptions = {
  name: vars.SESSION.id,
  secret: vars.SESSION.secret as string,
  resave: true,
  saveUninitialized: true,
  store: sessionStore,
  rolling: true,
  cookie: {
    secure: isProd,
    sameSite: isProd,
    httpOnly: isProd,
    domain: vars.variables.hostname,
    maxAge: vars.SESSION.maxAge,
    signed: isProd,
  },
};

environment.use(session(sess) as any);

export default environment;