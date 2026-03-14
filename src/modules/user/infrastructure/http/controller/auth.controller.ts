import { env, getJwtAccessTtlMs, getJwtRefreshTtlMs } from '../../../../../config/env';
import { AppError } from '../../../../../shared/domain/errors/AppError';
import { asyncHandler } from '../../../../../shared/infrastructure/http/asyncHandler';
import { ForgotPasswordUsecase } from '../../../application/usecase/forgotPassword.usecase';
import { GetmeUserUsecase } from '../../../application/usecase/getMeUser.usecase';
import { LoginuserUsecase } from '../../../application/usecase/loginuser.usecase';
import { LogoutUsecase } from '../../../application/usecase/logout.usecase';
import { RefreshTokenUsecase } from '../../../application/usecase/refreshToken.usecase';
import { RegisterUserUsecase } from '../../../application/usecase/registerUser.usecase';
import { ResendVerificationUsecase } from '../../../application/usecase/resendToken.usecase';
import { ResetPasswordUsecase } from '../../../application/usecase/resetPassword.usecase';
import { VerifyEmailUsecase } from '../../../application/usecase/verifyEmail.usecase';
import { UserPresenter } from '../../presenter/user.presenter';
import { Request, Response } from 'express';

export class AuthController {
  constructor(
    private readonly registerUserUC: RegisterUserUsecase,
    private readonly loginUserUC: LoginuserUsecase,
    private readonly getMeUserUC: GetmeUserUsecase,
    private readonly refreshTokenUC: RefreshTokenUsecase,
    private readonly logoutUC: LogoutUsecase,
    private readonly verifyEmailUC: VerifyEmailUsecase,
    private readonly resendTokenUC: ResendVerificationUsecase,
    private readonly forgotPasswordUC: ForgotPasswordUsecase,
    private readonly resetPasswordUC: ResetPasswordUsecase,
    private readonly userPresenter: UserPresenter,
  ) {}

  private getCookieBaseOptions() {
    const raw = (env.COOKIE_DOMAIN ?? '').trim();

    const domain = raw && /^[a-z0-9.-]+$/i.test(raw) && raw !== 'localhost' ? raw : undefined;

    const secure = env.COOKIE_SECURE;

    return {
      httpOnly: true,
      secure,
      sameSite: secure ? ('none' as const) : ('lax' as const),
      domain,
      path: '/',
    };
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    const opts = {
      ...this.getCookieBaseOptions(),
      maxAge: getJwtRefreshTtlMs(),
    };
    res.cookie('refreshToken', token, opts);
  }

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    const user = await this.registerUserUC.execute({ email, username, password });
    res.status(201).json({
      message: 'User registered successfully',
      data: this.userPresenter.one(user),
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const tokens = await this.loginUserUC.execute({ email, password });
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    res.status(200).json({
      message: 'Login successful',
      accessToken: tokens.accessToken,
      expiresIn: getJwtAccessTtlMs(),
    });
  });

  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub!;

    const user = await this.getMeUserUC.execute(userId);
    res.status(200).json({
      message: 'User retrieved successfully',
      data: this.userPresenter.one(user),
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      throw new AppError('Refresh token missing', 401, 'UNAUTHORIZED');
    }
    const { accessToken } = await this.refreshTokenUC.execute(token);
    res.status(200).json({
      accessToken,
      expiresIn: getJwtAccessTtlMs(),
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub!;
    await this.logoutUC.execute(userId);
    res.clearCookie('refreshToken', this.getCookieBaseOptions());
    res.status(200).json({
      message: 'Logout successful',
    });
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    await this.verifyEmailUC.execute({ token: token as string });
    res.status(200).json({
      message: 'Email verified successfully',
    });
  });

  resendverification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await this.resendTokenUC.execute({ email });
    res.status(200).json({
      message: 'If an account with that email exists, a new verification link has been sent.',
    });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await this.forgotPasswordUC.execute({ email });
    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    const { token } = req.query;
    await this.resetPasswordUC.execute({ token: token as string, newPassword });
    res.status(200).json({
      message: 'Password reset successful',
    });
  });
}
