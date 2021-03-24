import dotenv from 'dotenv';
import {Smtp} from '../models/_types/smtp';
dotenv.config()

export const variables: any = {
  nodeEnv: process.env.NODE_ENV,
  httpPort: process.env.HTTP_PORT,
  port: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
  hostname: process.env.HOSTNAME,
  session_id: process.env.SESSION_ID,
  session_secret: process.env.SESSION_SECRET,
}
export const DB_CONFIG = {
  host: process.env.DB_URL,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  debug: false
};
export const app = {
  hostname: process.env.APP_HOSTNAME,
  url: process.env.APP_URL,
  url2: process.env.APP_URL2,
  path: process.env.APP_PATH
}
export const CORS = {
  origin: [
    `http://${app.url}`,
    `https://${app.url}`,
    `http://${app.url2}`,
    `https://${app.url2}`,
    `http://localhost:4200`,
    `https://localhost:4200`,
    `http://localhost:4000`,
    `https://localhost:4000`
  ],
  credentials: true,
}
export const smtp: Smtp = process.env.SMTP_POOL === 'true' ?
  {
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
  reset_expire_time: process.env.TOKEN_RESET_EXPIRE_TIME,
  verify_expire_time: process.env.TOKEN_VERIFY_EXPIRE_TIME,
}

export const SSL = {
  cert: process.env.SSL_CERT,
  key: process.env.SSL_KEY
}
