import { Db } from '../db';
import { Pool, Query, queryCallback } from 'mysql';
import { UserModel } from '../../models/user.model';
import { TokenModel } from '../../models/token.model';

export class VerificationTokenDb extends Db{
  constructor(db: Pool) {
    super(db)
  }
   deleteVerifyTokenStore = async (params: string, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'DELETE FROM token_verify_account WHERE token_id= ?',
      [params], next
    );
  }

   userVerify = async (params: Partial<TokenModel | UserModel>, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'UPDATE users SET verification_token=null, verification_status=1 where email = ? ',
      [(params as UserModel).email], next
    );
  }

  /**
   * Add Token To User
   * @param params
   * @param next
   */
   verifyAccountToken = async (params: Partial<TokenModel | UserModel>, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'UPDATE `users` SET verification_token= ? WHERE email= ?',
      [(params as TokenModel).token, (params as UserModel).email], next
    );
  }

  /**
   * Create Token Storage for Encrypted Data
   * @param params
   * @param next
   */
   verifyAccountTokenStore = async (params: TokenModel, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'INSERT INTO `token_verify_account` (token_id, expires, data) VALUES (?, ?, ?)',
      [params.id, params.expires, params.token], next
    );
  }
  /**
   * Get Verification Token Data
   * @param params
   * @param next
   */
   userVerifyAccountToken = async (params: TokenModel, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `verification_token` FROM view_tokens where verification_token= ?',
      [params], next
    );
  }
   getVerifyAccountTokenStore = async (params: string, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `data` FROM token_verify_account where token_id = ?',
      [params], next
    );
  }
   getVerifyAccountTokenStoreExpiration = async (params: string, next: queryCallback): Promise<Query> => {
    return this.db.query(
      'SELECT `expires` FROM token_verify_account where token_id = ?',
      [params], next
    );
  }
}
