import { DB_CONFIG, smtp } from '../../environments/variables';
import { Mailer } from '../../utilities/nodemailer';
import { Crypto } from '../../utilities/crypto';
import { Db } from '../../database/db';
import mysql from 'mysql';
import { NextFunction, Request, Response } from 'express';
import * as vars from '../../environments/variables';
import { DateUtil } from '../../utilities/date';
import chalk from 'chalk';
import { User } from '../../models/_types/user';
import { comparePassword, hashPassword } from '../../utilities/bcrypt';
import { EmailData } from '../../models/_types/email-data';
export class UserController {
  private readonly crypto;
  private readonly db;
  private readonly mailer;
  private responseMessage;
  constructor() {
    this.db = new Db(mysql.createPool(DB_CONFIG));
    this.mailer = new Mailer(smtp)
    this.crypto = new Crypto();
    this.responseMessage = {
      message: ''
    }
  }

  getAllUsers = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    switch (vars.variables.nodeEnv) {
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
    if (!req.body.firstName)
      return res.status(422).send({ message: 'First Name is required' }).end();
    if (!req.body.lastName)
      return res.status(422).send({ message: 'Last Name is required' }).end();
    if (!req.body.username)
      return res.status(422).send({ message: 'Username is required' }).end()
    if (!req.body.username.match(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/))
      return res.status(422).send({ message: '' }).end();
    if (!req.body.email)
      return res.status(422).send({ message: 'Email is required' }).end();
    if (!req.body.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,4}$/))
      return res.status(422).send({ message: 'Email is invalid' }).end();
    if (!req.body.password) {
      return res.status(422).send({ message: 'Password is required'}).end();
    }
    if (!req.body.password.match(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@$!%*#?&])([a-zA-Z0-9\d@$!%*#?&]+){8,}/))
      return res.status(422).send(
        {
          message: 'passwords must be at least 8 characters long, contain 1 capital letter, ' +
            'a special character (@ $ ! % * # ? &), and at least one number.'
        }).end();
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
          return res.status(500).send(emailErr.message).end();
        }
        // Does email exist?
        if (emailRes.length) {
          return res.status(401).send({ message: 'Email Already exists' }).end();
        }
        // if email doesn't exist create user
        const user: User = {
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
          const num = parseInt(vars.token.verify_expire_time, 0);
          const expireDate = date.setExpire(num);
          console.log(expireDate);
          const data: Record<string, unknown> = {
            expires: expireDate,
            email: req.body.email
          };
          const tokenStore = this.crypto.generateString();
          const encryptedToken = this.crypto.createToken(JSON.stringify(data));
          const emailData: EmailData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            token: 'https://' + vars.app.hostname + vars.app.path + '/verify-account/' + tokenStore
          }
          const queryParams = {
            token: tokenStore,
            email: req.body.email
          }

          return this.db.verifyAccountToken(queryParams, (tokenErr, _tokenResults) => {
            if (tokenErr) {
              console.error(chalk.bgRed.white(tokenErr))
              return res.status(500).send(tokenErr).end();
            }
            return this.db.verifyAccountTokenStore([tokenStore, expireDate.getTime(),encryptedToken], (tokenStoreErr, _tokenStoreResults) => {
              if (tokenStoreErr) {
                console.error(chalk.bgRed.white(tokenStoreErr))
                return res.status(500).send(tokenStoreErr).end();
              }
               this.responseMessage.message = 'User Created Successfully';
              this.mailer.sendMail(vars.smtp.email, emailData, 'verify-email');
              return res.status(200).send (this.responseMessage).end()
            });
          });
        });
      });
    });
  }

  login = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    const email: string = req.body.email;
    const password: string = req.body.password;
    if (email === '') {
       this.responseMessage.message = "Email is required.";
      return res.status(409).send (this.responseMessage).end();
    }
    if (password === '') {
       this.responseMessage.message = "Password is required.";
      return res.status(409).send (this.responseMessage).end();
    }
    await this.db.getPassword(email, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err).end();
      } else {
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
            return res.status(200).send (this.responseMessage).end();
          });
        } catch (e) {
          console.log(e);
          return e;
        }
      }
    })
  }

  logout = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    req.session.destroy((err) => {
      err ? res.status(500).send({message: 'Could not logout.'}).end() :
      res.status(200).send({}).end();
    })
  }

  resetPassword = async (req: Request, res: Response, _next: NextFunction): Promise<any> => {
    if (!req.body.email)
      return res.status(400).send('Email is required').end();
    const email = req.body.email;
    await this.db.findUserFromEmail(email, (err, results) => {
      if (err) {
        return res.status(500).send(err).end();
      }
      const date = new DateUtil(new Date());
      if (!results.length){
         this.responseMessage.message = `If account exists, instructions to reset your password will be sent.`
        return res.status(200).send (this.responseMessage).end()
      }
      const num = parseInt(vars.token.reset_expire_time, 0);
      const expireDate = date.setExpire(num);
      const data: Record<string, unknown> = {
        expires: expireDate,
        email: req.body.email
      };
      const tokenStore = this.crypto.generateString();
      const encryptedToken = this.crypto.createToken(JSON.stringify(data));
      const emailData: EmailData = {
        firstName: results[0].firstName,
        lastName: results[0].lastName,
        email: results[0].email,
        token: 'https://' + vars.app.hostname + vars.app.path + '/reset-password/' + tokenStore
      }
      const queryParams = {
        token: tokenStore,
        id: results[0].id
      }

      this.db.resetPasswordToken(queryParams, (tokenErr, _results) => {
        if (tokenErr) {
          return res.status(500).send(tokenErr).end();
        }
        return this.db.resetPasswordTokenStore([tokenStore, expireDate.getTime(),encryptedToken], (tokenStoreErr, _tokenResults) => {
          if (tokenStoreErr) {
            return res.status(500).send(tokenStoreErr).end();
          }
          this.mailer.sendMail(vars.smtp.email, emailData, 'reset-password');
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
    res.status(200).send({ authenticated: true, verified: sessionData[0].verified, username: user.username });
  }
}
