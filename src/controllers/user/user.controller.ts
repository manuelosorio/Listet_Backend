import chalk from 'chalk';
import mysql, { MysqlError, Query, queryCallback } from 'mysql';
import { NextFunction, Request, Response } from 'express';
import { app, DB_CONFIG, smtp, token, variables } from '../../environments/variables';
import { Mailer } from '../../utilities/nodemailer';
import { Crypto } from '../../utilities/crypto';
import { DateUtil } from '../../utilities/date';
import { UserModel } from '../../models/user.model';
import { comparePassword, hashPassword } from '../../utilities/bcrypt';
import { EmailDataModel } from '../../models/email-data.model';
import { UserDb } from '../../database/user/user.db';
import { VerificationTokenDb } from '../../database/token/verification-token.db';
import { ResetTokenDb } from '../../database/token/reset-token.db';
import { TokenModel } from '../../models/token.model';
import { NewPasswordModel } from '../../models/new-password.model';

export class UserController {
  private readonly crypto;
  private readonly db: UserDb;
  private readonly verifyTokenDb: VerificationTokenDb;
  private readonly resetTokenDb: ResetTokenDb;
  private readonly mailer;
  private responseMessage;
  constructor() {
    this.db = new UserDb(mysql.createPool(DB_CONFIG));
    this.verifyTokenDb = new VerificationTokenDb(mysql.createPool(DB_CONFIG));
    this.resetTokenDb = new ResetTokenDb(mysql.createPool(DB_CONFIG));
    this.mailer = new Mailer(smtp)
    this.crypto = new Crypto();
    this.responseMessage = {
      message: ''
    }
  }

  getAllUsers = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    switch (variables.nodeEnv) {
      case 'Development':
      case 'development':
        await this.db.findAllUsers((err, results) => {
          if (err) {
            const errorMessage = `we failed to query users ${err}`;
            return res.sendStatus(500).send(errorMessage).end();
          }
          return res.status(200).send(results).end();
        });
        break;
      case 'Production':
      case 'production':
        res.status(200).send([{
          "username": "ForSecurityPurposes",
          "firstName": "Users are not",
          "lastName": "Shown in production"
        }]).end();
        break;
    }
  }

  getUser = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const userName = req.params.username;
    await this.db.findUserFromUsername(userName, (err, results) => {
      return err ? res.status(403).send(err).end() :
             !results.length ? res.status(404).send({message: 'User does not exist'}).end() : res.status(200).send(results).end();
    });
  }

  register = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const date = new DateUtil(new Date());
    return this.db.findUserFromUsername(req.body.username, (usernameErr, usernameRes) => {
      if (usernameErr) {
        return res.status(500).send({ message: usernameErr.message }).end();
      }
      // Does username exist?
      if (usernameRes.length) {
         this.responseMessage.message = 'Username already exists';
        return res.status(401).send (this.responseMessage).end();
      }
      // If user doesn't exist Check for email.
      return this.db.findUserFromEmail(req.body.email, (emailErr, emailRes) => {
        if (emailErr) {
          console.error(chalk.red('Find by Email Error: ') + emailErr.message);
          return res.status(500).end();
        }
        // Does email exist?
        if (emailRes.length) {
          return res.status(401).send({ message: 'Email Already exists' }).end();
        }
        const user: UserModel = {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email.toLowerCase(),
          username: req.body.username.toLowerCase(),
          password: hashPassword(req.body.password)
        }
        return this.db.newUser(user, (err, _results) => {
          if (err) {
            return err;
          }
          const num = parseInt(token.verify_expire_time, 0);
          const expireDate = date.setExpire(num);
          const data: Record<string, unknown> = {
            expires: expireDate,
            email: req.body.email
          };
          const tokenStore = this.crypto.generateString();
          const encryptedToken = this.crypto.createToken(JSON.stringify(data));
          const emailData: EmailDataModel = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            token: 'https://' + app.hostname + app.path + '/verify-account/' + tokenStore
          }
          const queryParams = {
            token: tokenStore,
            email: req.body.email
          }

          return this.verifyTokenDb.verifyAccountToken(queryParams, (tokenErr, _tokenResults) => {
            if (tokenErr) {
              console.error(chalk.bgRed.white(tokenErr))
              return res.status(500).end();
            }
            const tokenModel: TokenModel = {
              id: tokenStore,
              expires: expireDate.getTime(),
              token: encryptedToken
            }
            return this.verifyTokenDb.verifyAccountTokenStore(tokenModel, (tokenStoreErr, _tokenStoreResults) => {
              if (tokenStoreErr) {
                console.error(chalk.bgRed.white(tokenStoreErr))
                return res.status(500).end();
              }
               this.responseMessage.message = 'User Created Successfully';
              this.mailer.sendMail(smtp.email, emailData, 'verify-email');
              return res.status(200).send (this.responseMessage).end()
            });
          });
        });
      });
    });
  }

  login = async (req: Request, res: Response, _next: NextFunction): Promise<Query> => {
    const email: string = req.body.email;
    const password: string = req.body.password;
    return await this.db.getPassword(email, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      try {
        if (comparePassword(password, result[0].password) === false) {
           this.responseMessage.message = "Login Details Incorrect. Please Try Again.";
          return res.status(403).send (this.responseMessage).end();
        }
        return this.db.findUserFromEmail(email, (error, results) => {
          if (error) {
            return res.status(500).send(error).end();
          }
          this.db.userSession(req, results);
          this.responseMessage.message = 'Login Successful';
          const user: UserModel = results[0];
          return res.status(200).send({
            response: this.responseMessage,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            verified: results[0].verification_status
          }).end();
        });
      } catch (e) {
        console.error(e);
        return e;
      }
    })
  }

  logout = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    req.session.destroy((err) => {
      err ? res.status(500).send({message: 'Could not logout.'}).end() :
      res.status(200).send({}).end();
    })
  }

  resetPassword = async (req: Request, res: Response): Promise<Query | void> => {
    const email = req.body.email;
    return await this.db.findUserFromEmail(email, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      const date = new DateUtil(new Date());
      if (!results.length){
         this.responseMessage.message = `If account exists, instructions to reset your password will be sent.`
        return res.status(200).send (this.responseMessage).end()
      }
      const num = parseInt(token.reset_expire_time, 0);
      const expireDate = date.setExpire(num);
      const data: Record<string, unknown> = {
        expires: expireDate,
        email: req.body.email
      };
      const tokenStore = this.crypto.generateString();
      const encryptedToken = this.crypto.createToken(JSON.stringify(data));
      const emailData: EmailDataModel = {
        firstName: results[0].firstName,
        lastName: results[0].lastName,
        email: results[0].email,
        token: 'https://' + app.hostname + app.path + '/reset-password/' + tokenStore
      }
      const queryParams = {
        token: tokenStore,
        id: results[0].id
      }

      this.resetTokenDb.resetPasswordToken(queryParams, (tokenErr: MysqlError, _results) => {
        if (tokenErr) {
          console.error(tokenErr)
          return res.status(500).end();
        }
        const tokenModel: TokenModel = {
          id: tokenStore,
          expires: expireDate.getTime(),
          token: encryptedToken
        }
        return this.resetTokenDb.resetPasswordTokenStore(tokenModel, (tokenStoreErr: MysqlError, _tokenResults) => {
          if (tokenStoreErr) {
            console.error(tokenStoreErr)
            return res.status(500).end();
          }
          this.mailer.sendMail(smtp.email, emailData, 'reset-password');
           this.responseMessage.message = `If account exists, instructions to reset your password will be sent.`
          return res.status(200).send (this.responseMessage).end()
        });
      });
    });
  }

  session = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    if (!req.session.user) {
      return res.status(200).send({authenticated: false}).end();
    }
    const sessionData = req.session.user.map(result => {
      return {verified: result.verification_status === 1}
    });
    const user = req.session.user[0];
    return res.status(200).send({
      authenticated: true,
      verified: sessionData[0].verified,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  updateAccountInfo = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {

  }
  changePassword = async (req: Request, res: Response, _next: NextFunction): Promise<Query> => {
    const password: NewPasswordModel = req.body;
    if (password.newPassword === password.confirmPassword) {
      const queryData = {
        userID: req.session.user[0].id,
        password: hashPassword(password.newPassword)
      }
      return this.db.updatePassword(queryData, (error, _results) => {
        if (error) {
          console.error(error.message);
          res.status(500);
        }
        res.status(200).send({
          message: "Your password has been changed."
        })
      });
    }
    res.status(401).send({
      message: "Password does not match."
    })
  }
  deactivateUser = async (req: Request, res: Response, _next: NextFunction): Promise<Query> => {
    const user: UserModel = req.session.user[0];
    return this.db.deactivate(user, (error: MysqlError, results) => {
      if (error) {
        console.error(error.message);
        return res.status(500).end();
      }
      return results.changedRows === 1 ? res.status(200).send({
        message: "Your account has been deactivated."
       }).end() : res.status(200).send({
        message: "No changes where made to your account. It is possible that your account has been already deactivated."
       }).end();
    });
  }
  reactivateUser = async (req: Request, res: Response, _next: NextFunction): Promise<Query> => {
    const user: UserModel = req.session.user[0];
    return this.db.reactivate(user, (error: MysqlError, results) => {
      if (error) {
        console.error(error.message);
        return res.status(500).end();
      }
      return results.changedRows === 1 ? res.status(200).send({
        message: "Your account has been reactivated."
      }).end() : res.status(200).send({
        message: "No changes where made to your account. It is possible that your account has been already reactivated."
      }).end();
    });

  }
}
