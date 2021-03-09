import { Router } from 'express';
import mysql from 'mysql';
import { Db } from '../database/db';
import * as vars from '../environments/variables';
import { hashPassword } from '../middleware/bcrypt';
import { Crypto } from '../middleware/crypto';
import { DateUtil } from '../middleware/date';
import { ResetPassword } from '../models/reset-password';
import { VerifyAccount } from '../models/verify-account';
import chalk from "chalk";
const tokens = Router();
const db = new Db(mysql.createPool(vars.db));
const crypto = new Crypto();
const responseMessage = {
  message: ''
};

tokens.get('/reset-password/:tokenStore', async (req, res) => {
  const tokenStore = req.params.tokenStore;
  await db.userResetPasswordToken([tokenStore], (err, results) => {
    if (err) {
      return res.status(500).send(err).end();
    }
    return !results.length ?
      res.status(401).send('Token doesn\'t exist or has expired.')
      : db.getResetPasswordTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
        if (tokenErr) {
          return res.status(500).send(tokenErr).end();
        }
        const expires = tokenResults.map(result => {
          return result.expires;
        })[0];
        const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
        return isExpired === true ? res.status(401).send({message: 'Token doesn\'t exist or has expired.'}) : res.status(200).send({expired: false}).end();
      });
  });
});

tokens.put('/reset-password/:tokenStore', async (req, res) => {
  const tokenStore = req.params.tokenStore;
  const password = req.body.password;
  let newPassword: string;
  if (password === '') {
    responseMessage.message = 'Password is required.';
    return res.status(409).send(responseMessage).end();
  } else {
    newPassword = hashPassword(password);
  }
  await db.getResetPasswordTokenStore([tokenStore], (err, results) => {
    if (err) {
      return res.status(500).send(err).end();
    }
    if (!results.length) {
      return res.status(401).send("Token doesn't exist or has expired.");
    }
    const userEmail = results.map(result => {
      return crypto.decipher(result.data).email;
    })[0];
    console.log(userEmail);
    return db.getResetPasswordTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
      if (tokenErr) {
        return res.status(500).send(tokenErr).end();
      }
      const expires = tokenResults.map(result => {
        return result.expires;
      })[0];
      const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
      const data: ResetPassword = {email: userEmail, password: newPassword, token: tokenStore};
      console.log('expired', isExpired);
      if (isExpired) {
        return res.status(401).send({
          message: "Token doesn't exist or has expired."
        });
      } else {
        return db.deleteResetTokenStore(tokenStore, (deleteStoreErr, _) => {
          if (deleteStoreErr) {
            return res.send(deleteStoreErr);
          }
          return db.resetPassword(data, (resetPasswordErr, _resetPasswordResults) => {
            if (resetPasswordErr) {
              console.log(resetPasswordErr);
              return res.status(401).send(resetPasswordErr).end();
            }
            return res.status(200).send({message: 'Password has been reset.'}).end();
          });
        });
      }
    });
  });
});

tokens.get('/verify-account', (req, res) => {
  res.send('test');
});
tokens.get('/verify-account/:tokenStore', async (req, res) => {
  const tokenStore = req.params.tokenStore;
 await db.getVerifyAccountTokenStore([tokenStore], (err, results) => {
    if (err) {
      return res.status(500).send(err).end();
    }
    let userEmail = null;
    try {
      userEmail = results.map(result => {
        return crypto.decipher(result.data).email;
      })[0];
    } catch (err) {
      console.error(chalk.red(err));
    }
    return !results.length && !!userEmail ?
      res.status(401).send("Token doesn't exist or has expired.")
      : db.getVerifyAccountTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
        if (tokenErr) {
          return res.status(500).send(tokenErr).end();
        }
        const expires = tokenResults.map(result => {
          return result.expires;
        })[0];
        const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
        const data: VerifyAccount = {email: userEmail, token: tokenStore};
        return isExpired === true ? res.status(401).send({message: "Token doesn't exist or has expired."})
          : db.deleteVerifyTokenStore(tokenStore, (deleteStoreErr, _) => {
            if (deleteStoreErr) {
              return res.send(deleteStoreErr);
            }
            return db.userVerify(data, (verifyErr, _verifyResults) => {
              if (verifyErr) {
                console.log(verifyErr);
                return res.status(401).send(verifyErr).end();
              }
              return res.status(200).send({message: 'Your account has been verified'}).end();
            });
          });
      })
  })
});
export default tokens;
