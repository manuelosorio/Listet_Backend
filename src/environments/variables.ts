import dotenv from 'dotenv';
import {Smtp} from '../models/smtp';
dotenv.config()

export const variables: any = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  db: {
    host: process.env.DB_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  session: {
    host: process.env.DB_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE || false,
    auth: {
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
    },
    email: process.env.SMTP_EMAIL
  },
  session_id: process.env.SESSION_ID,
  session_secret: process.env.SESSION_SECRET,
  app_url: process.env.APP_URL,
  app_url2: process.env.APP_URL2,

}

export let smtp: Smtp;
smtp = process.env.SMTP_POOL === 'true' ? {
  pool: true,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT as unknown as number,
  secure: process.env.SMTP_SECURE as unknown as boolean || false,
  auth: {
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
  },
  email: process.env.SMTP_EMAIL
} : {
  host: process.env.SMTP_HOST,
  'port': process.env.SMTP_PORT as unknown as number,
  'secure': process.env.SMTP_SECURE as unknown as boolean || false,
  'auth': {
  'username': process.env.SMTP_USERNAME,
    'password': process.env.SMTP_PASSWORD,
  },
  email: process.env.SMTP_EMAIL
};
export const session = {
  id: process.env.SESSION_ID,
  secret: process.env.SESSION_SECRET,
}
export const token = {
  secret: process.env.TOKEN_SECRET,
  expire_time: process.env.TOKEN_EXPIRE_TIME,
}
