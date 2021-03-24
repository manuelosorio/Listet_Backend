import { Router } from 'express';
import { ResetTokenController } from '../controllers/token/reset-token.controller';
import { VerificationTokenController } from '../controllers/token/verification-token.controller';
const tokensApi = Router();

const resetToken = new ResetTokenController();
const verifyToken = new VerificationTokenController()

tokensApi.get('/reset-password/:tokenStore', resetToken.checkToken);
tokensApi.put('/reset-password/:tokenStore', resetToken.resetPassword);

tokensApi.get('/verify-account', (req, res) => {
  res.send('test');
});
tokensApi.get('/verify-account/:tokenStore', verifyToken.verifyAccount);
export default tokensApi;
