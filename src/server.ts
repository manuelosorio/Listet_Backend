import express from 'express';
import dotenv from "dotenv";
import mysql from 'mysql';

dotenv.config();

const server = express();
const port = process.env.PORT;

const connection = mysql.createConnection({
  host: process.env.DB_URL,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})


server.get('/', (req, res) => {
  res.send('Hello World');
});

server.listen(port, err => {
  if (err) {
    throw err;
  }
  return console.log(`server is listening on ${port}`);
})

