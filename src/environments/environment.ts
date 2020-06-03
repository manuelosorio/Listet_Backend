import express from 'express'
import {variables} from './variables';
import development from './environment.dev';

const environment = express();
const env = variables.nodeEnv;



if (env === 'development')  {
  environment.use(development)
}

if (env === 'production') {

}

export = environment;
