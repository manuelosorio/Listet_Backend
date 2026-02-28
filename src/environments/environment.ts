import express from 'express';
import session from 'express-session';
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

if (isProd) {
  environment.use(helmet());
  environment.set('trust proxy', true);
}

environment.use(
  session({
    name: vars.SESSION.id,
    secret: vars.SESSION.secret,
    resave: true,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: isProd,
      sameSite: isProd ? true : undefined,
      httpOnly: isProd,
      domain: isProd ? vars.variables.hostname : undefined,
      maxAge: vars.SESSION.maxAge || 30 * 60 * 1000,
      signed: true,
    },
  }) as any
);

export default environment;
