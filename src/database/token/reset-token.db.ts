import { Db } from '../db';
import { Pool, Query, queryCallback } from 'mysql';
import { ResetPasswordModel } from '../../models/reset-password.model';
import { TokenModel } from '../../models/token.model';


export class ResetTokenDb extends Db{
  constructor(db: Pool) {
    super(db)
  }


  /**
   * Add Token To User
   * @param tokenStore
   * @param next
   */
  resetPasswordToken = async (tokenStore: TokenModel, next: queryCallback): Promise<Query> => {
    return this.db.query('UPDATE `users` SET reset_token= ? WHERE id= ?', [tokenStore.token, tokenStore.id], next);
  }
  /**
   * Create Token Storage for Encrypted Data
   * @param tokenStore
   * @param next
   */
  resetPasswordTokenStore = async (tokenStore: TokenModel, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'INSERT INTO `token_reset_password` (token_id, expires, data) VALUES (?, ?, ?)',
      [tokenStore.id, tokenStore.expires, tokenStore.token], next
    );
  }
  /**
   * Get Reset Token Data
   * @param tokenStore
   * @param next
   */
  userResetPasswordToken = async (tokenStore: string, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `reset_token` FROM view_tokens where reset_token= ?',
      [tokenStore],next
    );
  }
  /**
   * Get the Expiration Date for Token
   * @param tokenStore
   * @param next
   */
  getResetPasswordTokenStoreExpiration = async (tokenStore: string, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `expires` FROM token_reset_password where token_id = ?',
      [tokenStore], next
    );
  }
  getResetPasswordTokenStore = async (tokenStore: string, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `data` FROM token_reset_password where token_id = ?',
      [tokenStore],next
    );
  }
  /**
   * Updates Password Deletes token
   * @param params
   * @param next
   */
  resetPassword = async (params: ResetPasswordModel, next: queryCallback): Promise<Query> => {
    return this.db.query(`UPDATE users SET reset_token= null, password = ? WHERE email = ?`, [params.password, params.email], next);
  }
  deleteResetTokenStore = async (tokenStore: string, next: queryCallback): Promise<Query> => {
    return this.db.query('DELETE FROM token_reset_password WHERE token_id= ?',
      [tokenStore], next)
  }
}
