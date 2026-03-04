import express from 'express';
import session, { SessionOptions } from 'express-session';
import * as expressSession from 'express-session';
import morgan from 'morgan';
import cors from 'cors';
import MySQLSession from 'express-mysql-session';
import * as vars from './variables';
import mysql from 'mysql';

const isProd = vars.variables.nodeEnv === 'production';

const MySQLStore = MySQLSession(expressSession);

const db = mysql.createPool(vars.DB_CONFIG);
const sessionStore = new MySQLStore({}, db);

const environment = express();

environment.use(morgan(isProd ? 'combined' : 'tiny'));
environment.use(cors(vars.CORS));

const sess: SessionOptions = {
  name: vars.SESSION.id,
  secret: vars.SESSION.secret as string,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  rolling: true,
  cookie: {
    secure: isProd,
    sameSite: isProd ? 'strict' : undefined,
    httpOnly: true,
    maxAge: vars.SESSION.maxAge,
  },
};

environment.use(session(sess) as any);

export default environment;
