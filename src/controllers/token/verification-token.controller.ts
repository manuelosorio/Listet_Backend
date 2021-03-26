import mysql from 'mysql';
import { Request, Response } from 'express';
import chalk from 'chalk';
import { DateUtil } from '../../utilities/date';
import { Crypto } from '../../utilities/crypto';
import { DB_CONFIG } from '../../environments/variables';
import { VerificationTokenDb } from '../../database/token/verification-token.db';
import { VerifyAccountModel } from '../../models/verify-account.model';

export class VerificationTokenController {
  private readonly db: VerificationTokenDb;
  private readonly crypto;
  private readonly responseMessage;

  constructor() {
    this.db = new VerificationTokenDb(mysql.createPool(DB_CONFIG));
    this.crypto = new Crypto();
    this.responseMessage = {
      message: ''
    };
  }
  verifyAccount = async (req: Request, res: Response): Promise<any> => {
    const tokenStore = req.params.tokenStore;
    await this.db.getVerifyAccountTokenStore([tokenStore], (err, results) => {
      if (err) {
        return res.status(500).send(err).end();
      }
      let userEmail = null;
      try {
        userEmail = results.map(result => {
          return this.crypto.decipher(result.data).email;
        })[0];
      } catch (err) {
        console.error(chalk.red(err));
      }
      return !results.length && !!userEmail ?
             res.status(401).send("Token doesn't exist or has expired.")
                                            : this.db.getVerifyAccountTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
          if (tokenErr) {
            return res.status(500).send(tokenErr).end();
          }
          const expires = tokenResults.map(result => {
            return result.expires;
          })[0];
          const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
          const data: VerifyAccountModel = {email: userEmail, token: tokenStore};
          return isExpired === true ? res.status(401).send({message: "Token doesn't exist or has expired."})
                                    : this.db.deleteVerifyTokenStore(tokenStore, (deleteStoreErr, _) => {
              if (deleteStoreErr) {
                return res.send(deleteStoreErr);
              }
              return this.db.userVerify(data, (verifyErr, _verifyResults) => {
                if (verifyErr) {
                  console.log(verifyErr);
                  return res.status(401).send(verifyErr).end();
                }
                return res.status(200).send({message: 'Your account has been verified'}).end();
              });
            });
        });
    });
  }

}
