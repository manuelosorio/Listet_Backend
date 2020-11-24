import dotenv from 'dotenv';
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
  saltsRounds: process.env.BYCRPT_SALT,
  session_id: process.env.SESSION_ID,
  session_secret: process.env.SESSION_SECRET,
  app_url: process.env.APP_URL,
  app_url2: process.env.APP_URL2,
}
