import express, { Router } from 'express';
import session from 'express-session';
import * as expressSession from 'express-session';
import morgan from 'morgan';
import cors from 'cors';
import * as vars from './variables';
import MySQLSession from 'express-mysql-session';

const dev = Router();

const MySQLStore = MySQLSession(expressSession);
const sessionStore = new MySQLStore(vars.DB_CONFIG);

const sess: expressSession.SessionOptions = {
  name: vars.session.id,
  secret: vars.session.secret,
  resave: true,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: false,
    maxAge: process.env.SESSION_MAX_AGE as unknown as number || 2 * 60 * 60 * 1000
  },
}

dev.use(cors(vars.CORS));
dev.use(express.static('private'));
dev.use(morgan('tiny'));
dev.use(session(sess));

export = dev;
