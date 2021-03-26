import { Db } from '../db';
import { Pool, queryCallback } from 'mysql';

export class VerificationTokenDb extends Db{
  constructor(db: Pool) {
    super(db)
  }
   deleteVerifyTokenStore = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('DELETE FROM token_verify_account WHERE token_id= ?',
      [params, params], next)
  }

   userVerify = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('UPDATE users SET verification_token=null, verification_status=1 where email = ? ', [params.email],next);
  }

  /**
   * Add Token To User
   * @param params
   * @param next
   */
   verifyAccountToken = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('UPDATE `users` SET verification_token= ? WHERE email= ?', [params.token, params.email], next);
  }

  /**
   * Create Token Storage for Encrypted Data
   * @param params
   * @param next
   */
   verifyAccountTokenStore = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('INSERT INTO `token_verify_account` (token_id, expires, data) VALUES (?, ?, ?)', params, next);
  }
  /**
   * Get Verification Token Data
   * @param params
   * @param next
   */
   userVerifyAccountToken = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('SELECT `verification_token` FROM view_tokens where verification_token= ?', [params],next);
  }
   getVerifyAccountTokenStore = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('SELECT `data` FROM token_verify_account where token_id = ?', [params],next);
  }
   getVerifyAccountTokenStoreExpiration = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('SELECT `expires` FROM token_verify_account where token_id = ?', [params],next);
  }
}
