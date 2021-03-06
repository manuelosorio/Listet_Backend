import { DateUtil } from '../../utilities/date';
import { Response, Request } from 'express';
import mysql, { Query } from 'mysql';
import { DB_CONFIG } from '../../environments/variables';
import { hashPassword } from '../../utilities/bcrypt';
import { Crypto } from '../../utilities/crypto';
import { ResetTokenDb } from '../../database/token/reset-token.db';
import { ResetPasswordModel } from '../../models/reset-password.model';

export class ResetTokenController {
  private readonly db: ResetTokenDb;
  private readonly crypto;
  private readonly responseMessage;

  constructor() {
    this.db = new ResetTokenDb(mysql.createPool(DB_CONFIG));
    this.crypto = new Crypto();
    this.responseMessage = {
      message: ''
    };
  }
  checkToken = (req: Request, res: Response): Promise<Query> => {
    const tokenStore: string = req.params.tokenStore;
    return this.db.userResetPasswordToken(tokenStore, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      return !results.length ?
             res.status(401).send("Token doesn't exist or has expired.") : this.db.getResetPasswordTokenStoreExpiration(tokenStore, (tokenErr, tokenResults) => {
          if (tokenErr) {
            console.error(tokenErr);
            return res.status(500).end();
          }
          const expires = tokenResults.map(result => {
            return result.expires;
          })[0];
          const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
          return isExpired === true ? res.status(401).send({message: "Token doesn't exist or has expired."}) : res.status(200).send({expired: false}).end();
        });
    });
  }

  resetPassword = (req: Request, res: Response): Promise<Query> | void => {
    const tokenStore = req.params.tokenStore;
    const password = req.body.password;
    if (password === '') {
      this.responseMessage.message = 'Password is required.';
      return res.status(409).send(this.responseMessage).end();
    }
    const newPassword = hashPassword(password);
    return this.db.getResetPasswordTokenStore(tokenStore, (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).end();
      }
      if (!results.length) {
        return res.status(401).send("Token doesn't exist or has expired.");
      }
      const userEmail = results.map(result => {
        return this.crypto.decipher(result.data).email;
      })[0];
      return this.db.getResetPasswordTokenStoreExpiration(tokenStore, (tokenErr, tokenResults) => {
        if (tokenErr) {
          return res.status(500).send().end();
        }
        const expires = tokenResults.map(result => {
          return result.expires;
        })[0];
        const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
        const data: ResetPasswordModel = {email: userEmail, password: newPassword, token: tokenStore};
        if (isExpired) {
          return res.status(401).send({
            message: "Token doesn't exist or has expired."
          }).end();
        }
        return this.db.deleteResetTokenStore(tokenStore, (deleteStoreErr, _) => {
          if (deleteStoreErr) {
            console.error(deleteStoreErr);
            return res.status(500).end();
          }
          return this.db.resetPassword(data, (resetPasswordErr, _resetPasswordResults) => {
            if (resetPasswordErr) {
              console.error(resetPasswordErr);
              return res.status(401).end();
            }
            return res.status(200).send({message: 'Password has been reset.'}).end();
          });
        });
      });
    });
  }
}
