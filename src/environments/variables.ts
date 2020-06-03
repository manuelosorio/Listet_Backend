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
  postUserQuery: process.env.DB_POST_USER_QUERY,
  saltsRounds: process.env.BYCRPT_SALT,
  session_id: process.env.SESSION_ID,
  session_secret: process.env.SESSION_SECRET,
}
