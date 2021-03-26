import { Db } from '../db';
import { Pool, queryCallback } from 'mysql';
import { ResetPasswordModel } from '../../models/reset-password.model';

export class ResetTokenDb extends Db{
  constructor(db: Pool) {
    super(db)
  }


  /**
   * Add Token To User
   * @param params
   * @param next
   */
  resetPasswordToken = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('UPDATE `users` SET reset_token= ? WHERE id= ?', [params.token, params.id], next);
  }
  /**
   * Create Token Storage for Encrypted Data
   * @param params
   * @param next
   */
  resetPasswordTokenStore = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('INSERT INTO `token_reset_password` (token_id, expires, data) VALUES (?, ?, ?)', params, next);
  }
  /**
   * Get Reset Token Data
   * @param params
   * @param next
   */
  userResetPasswordToken = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('SELECT `reset_token` FROM view_tokens where reset_token= ?', [params],next);
  }
  /**
   * Get the Expiration Date for Token
   * @param params
   * @param next
   */
  getResetPasswordTokenStoreExpiration = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('SELECT `expires` FROM token_reset_password where token_id = ?', [params],next);
  }
  getResetPasswordTokenStore = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('SELECT `data` FROM token_reset_password where token_id = ?', [params],next);
  }
  /*
   * Updates Password Deletes token
   * @param params
   * @param next
   */
  resetPassword = async (params: ResetPasswordModel, next: queryCallback): Promise<void> => {
    await this.db.query(`UPDATE users SET reset_token= null, password = ? WHERE email = ?`, [params.password, params.email], next);
  }
  deleteResetTokenStore = async (params, next: queryCallback): Promise<void> => {
    await this.db.query('DELETE FROM token_reset_password WHERE token_id= ?',
      [params, params], next)
  }
}
