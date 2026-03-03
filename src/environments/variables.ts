import dotenv from 'dotenv';
import { SmtpModel } from '../models/smtp.model';
import { ConnectionConfig } from 'mysql';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'path';
const root = join(__dirname, '..', '..');
dotenv.config();

export const variables: any = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
  hostname: process.env.HOSTNAME,
};


const sslEnabled = (process.env.SSL_ENABLED ?? '').trim().toLowerCase() === 'true';

export const DB_CONFIG: ConnectionConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  debug: (process.env.DB_DEBUG ?? '').trim() === 'true',
  charset: 'utf8mb4',
};
if (sslEnabled) {
  DB_CONFIG.ssl = {
    ca: readFileSync(resolve(root, process.env.DB_SSL_CA!), "utf8"),
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };
}

const corsOrigin: string[] = [];
const appURL = process.env.APP_URL.split(' ');

for (let i = 0; i < appURL.length; i++) {
  corsOrigin.push(`http://${appURL[i]}`);
  corsOrigin.push(`https://${appURL[i]}`);
}
export const APP = {
  hostname: process.env.APP_HOSTNAME,
  // url: process.env.APP_URL.split,
  path: process.env.APP_PATH ?? '',
};
export const CORS = {
  origin: corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
};
export const SMTP: SmtpModel = {
  pool: (process.env.SMTP_POOL ?? '').trim().toLowerCase() === 'true',
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: (process.env.SMTP_SECURE ?? '').trim().toLowerCase() === 'true',
  auth: {
    username: process.env.SMTP_USERNAME!,
    password: process.env.SMTP_PASSWORD!,
  },
  email: process.env.SMTP_EMAIL,
};
export const SESSION = {
  id: process.env.SESSION_ID,
  secret: process.env.SESSION_SECRET,
  maxAge: parseInt(process.env.MAX_AGE || '7200000'),
};
export const TOKEN = {
  secret: process.env.TOKEN_SECRET,
  reset_expire_time: process.env.TOKEN_RESET_EXPIRE_TIME,
  verify_expire_time: process.env.TOKEN_VERIFY_EXPIRE_TIME,
};

export const SSL = {
  cert: process.env.SSL_CERT,
  key: process.env.SSL_KEY,
};
