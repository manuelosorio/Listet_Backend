import express from 'express'
import bodyParser from "body-parser";

import {variables} from './variables';
import development from './environment.dev';
import production from './environment.prod';


const environment = express();
const env = variables.nodeEnv;

environment.use(bodyParser.json());
environment.use(bodyParser.urlencoded({extended: false}))

switch (env) {
  case 'development':
    environment.use(development)
    break;
  case 'production':
    environment.use(production)
    break;
}

export = environment;
