import dotenv from 'dotenv';
import { SmtpModel } from '../models/smtp.model';
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
const corsOrigin: string[] = [];
const appURL = process.env.APP_URL.split(' ');

for (let i = 0; i < appURL.length; + i++) {
  corsOrigin.push(`http://${appURL[i]}`);
  corsOrigin.push(`https://${appURL[i]}`);
}
export const app = {
  hostname: process.env.APP_HOSTNAME,
  // url: process.env.APP_URL.split,
  path: process.env.APP_PATH
}
export const CORS = {
  origin: corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200

}
export const smtp: SmtpModel = process.env.SMTP_POOL === 'true' ?
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
    port: process.env.SMTP_PORT as unknown as number,
    secure: process.env.SMTP_SECURE as unknown as boolean || false,
    auth: {
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
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
