import { Router } from 'express'
import bodyParser from "body-parser";

import {variables} from './variables';
import development from './environment.dev';
import production from './environment.prod';


const environment = Router();
const env = variables.nodeEnv;

environment.use(bodyParser.json());
environment.use(bodyParser.urlencoded({extended: false}))

switch (env) {
  case 'Development':
  case 'development':
    environment.use(development)
  break;

  case 'Production':
  case 'production':
    environment.use(production)
  break;
}

export = environment;
