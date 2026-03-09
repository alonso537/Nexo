import { ForgotPasswordUsecase } from '../modules/user/application/usecase/forgotPassword.usecase';
import { GetmeUserUsecase } from '../modules/user/application/usecase/getMeUser.usecase';
import { LoginuserUsecase } from '../modules/user/application/usecase/loginuser.usecase';
import { LogoutUsecase } from '../modules/user/application/usecase/logout.usecase';
import { RefreshTokenUsecase } from '../modules/user/application/usecase/refreshToke.usecase';
import { RegisterUserUsecase } from '../modules/user/application/usecase/registerUser.usecase';
import { ResendVerificationUsecase } from '../modules/user/application/usecase/resendToken.usecase';
import { ResetPasswordUsecase } from '../modules/user/application/usecase/resetPassword.usecase';
import { VerifyEmailUsecase } from '../modules/user/application/usecase/verifyEmail.usecase';
import { UserRepositoryImpl } from '../modules/user/infrastructure/db/mongo/repositories/userRepository.impl';
import { AuthController } from '../modules/user/infrastructure/http/controller/auth.controller';
import { UserPresenter } from '../modules/user/infrastructure/presenter/user.presenter';
import { BcryptAdapter } from '../modules/user/infrastructure/security/BcryptAdapter.adapter';
import { JwtAdapter } from '../modules/user/infrastructure/security/JwtAdapter.adapter';

class Container {
  //services
  private tokenService = new JwtAdapter();
  private passwordService = new BcryptAdapter();

  //repositories
  private userRep = new UserRepositoryImpl();

  //usecases auth
  private registerUserUC = new RegisterUserUsecase(this.userRep, this.passwordService);
  private loginUserUC = new LoginuserUsecase(this.userRep, this.tokenService, this.passwordService);
  private getMeUserUC = new GetmeUserUsecase(this.userRep);
  private refreshTokenUC = new RefreshTokenUsecase(this.userRep, this.tokenService);
  private logoutUC = new LogoutUsecase(this.userRep);
  private verifyEmailUC = new VerifyEmailUsecase(this.userRep);
  private resendVerificationUC = new ResendVerificationUsecase(this.userRep);
  private forgotPasswordUC = new ForgotPasswordUsecase(this.userRep);
  private resetPasswordUC = new ResetPasswordUsecase(this.userRep, this.passwordService);
  //presenters
  private userPresenter = new UserPresenter();
  //controllers
  private authController = new AuthController(
    this.registerUserUC,
    this.loginUserUC,
    this.getMeUserUC,
    this.refreshTokenUC,
    this.logoutUC,
    this.verifyEmailUC,
    this.resendVerificationUC,
    this.forgotPasswordUC,
    this.resetPasswordUC,
    this.userPresenter,
  );

  get AuthController() {
    return this.authController;
  }
}

export const container = new Container();
