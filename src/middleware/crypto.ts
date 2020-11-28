import {createCipheriv, createDecipheriv, randomBytes} from 'crypto'
import {Buffer} from 'buffer';
import {token} from '../environments/variables';
export class Crypto {
  secret;
  constructor() {
    this.secret = token.secret;
  }

  /**
   * Generates random string.
   * @param size
   */
  generateString(size: number = 20) {
    return randomBytes(size).toString('hex').slice(0, size);
  }

  /**
   * Create an encrypted token that contains object data saved as a string
   * @param data Stringify Object.
   */
  createToken(data: string) {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(this.secret), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypt and parse token data
   * @param encryptedToken
   */
  decipher(encryptedToken) {
    const tokenParts = encryptedToken.split(':');
    const iv = Buffer.from(tokenParts.shift(), 'hex');
    const encryptedText = Buffer.from(tokenParts.shift(), 'hex');
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(this.secret), iv)
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  }
}
