import { Router } from 'express';
import { validate } from '../../../../../shared/infrastructure/http/express/middleware/validateBody.middleware';
import { RegisterUserSchema } from '../../../application/dto/registerUser.dto';
import { container } from '../../../../../config/container';
import { LoginUserSchema } from '../../../application/dto/loginUser.dto';
import { verifyEmailSchema } from '../../../application/dto/verifyEmail.dto';
import { ForgotPasswordSchema } from '../../../application/dto/forgotPassword.dto';
import { ResetPasswordSchema } from '../../../application/dto/resetPassword.dto';
import { ResendVerificationSchema } from '../../../application/dto/resendToken.dto';

export const authRoutes = Router();

const auth = container.AuthController;
const authenticate = container.authenticate;

authRoutes.post('/register', validate(RegisterUserSchema), auth.register);
authRoutes.post('/login', validate(LoginUserSchema), auth.login);
authRoutes.post('/refresh-token', auth.refreshToken);
authRoutes.post('/logout', authenticate, auth.logout);
authRoutes.post('/forgot-password', validate(ForgotPasswordSchema), auth.forgotPassword);
authRoutes.post('/reset-password', validate(ResetPasswordSchema), auth.resetPassword);
authRoutes.get('/verify-email', validate(verifyEmailSchema), auth.verifyEmail);
authRoutes.post('/resend-verification', validate(ResendVerificationSchema), auth.resendverification);
authRoutes.get('/me', authenticate, auth.getMe);
