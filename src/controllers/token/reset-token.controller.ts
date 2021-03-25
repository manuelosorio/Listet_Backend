import { DateUtil } from '../../utilities/date';
import { Response, Request } from 'express';
import { Db } from '../../database/db';
import mysql from 'mysql';
import { DB_CONFIG } from '../../environments/variables';
import { hashPassword } from '../../utilities/bcrypt';
import { ResetPassword } from '../../models/_types/reset-password';
import { Crypto } from '../../utilities/crypto';

export class ResetTokenController {
  private readonly db: Db;
  private readonly crypto;
  private readonly responseMessage;

  constructor() {
    this.db = new Db(mysql.createPool(DB_CONFIG));
    this.crypto = new Crypto();
    this.responseMessage = {
      message: ''
    };
  }
  checkToken = async (req: Request, res: Response): Promise<any> => {
    const tokenStore = req.params.tokenStore;
    await this.db.userResetPasswordToken([tokenStore], (err, results) => {
      if (err) {
        return res.status(500).send(err).end();
      }
      return !results.length ?
             res.status(401).send("Token doesn't exist or has expired.") : this.db.getResetPasswordTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
          if (tokenErr) {
            return res.status(500).send(tokenErr).end();
          }
          const expires = tokenResults.map(result => {
            return result.expires;
          })[0];
          const isExpired: boolean = new DateUtil(new Date()).checkExpire(new Date(expires as number));
          return isExpired === true ? res.status(401).send({message: "Token doesn't exist or has expired."}) : res.status(200).send({expired: false}).end();
        });
    });
  }

  resetPassword = async (req: Request, res: Response): Promise<any> => {
    const tokenStore = req.params.tokenStore;
    const password = req.body.password;
    let newPassword: string;
    if (password === '') {
      this.responseMessage.message = 'Password is required.';
      return res.status(409).send(this.responseMessage).end();
    } else {
      newPassword = hashPassword(password);
    }
    await this.db.getResetPasswordTokenStore([tokenStore], (err, results) => {
      if (err) {
        return res.status(500).send(err).end();
      }
      if (!results.length) {
        return res.status(401).send("Token doesn't exist or has expired.");
      }
      const userEmail = results.map(result => {
        return this.crypto.decipher(result.data).email;
      })[0];
      console.log(userEmail);
      return this.db.getResetPasswordTokenStoreExpiration([tokenStore], (tokenErr, tokenResults) => {
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
          return this.db.deleteResetTokenStore(tokenStore, (deleteStoreErr, _) => {
            if (deleteStoreErr) {
              return res.send(deleteStoreErr);
            }
            return this.db.resetPassword(data, (resetPasswordErr, _resetPasswordResults) => {
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
  }
}
