import express from 'express'
import {variables} from './variables';
import development from './environment.dev';
import production from './environment.prod';


const environment = express();
const env = variables.nodeEnv;


switch (env) {
  case 'development':
    environment.use(development)
    break;
  case 'production':
    environment.use(production)
    break;
}

export = environment;
