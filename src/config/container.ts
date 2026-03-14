import { BlockUsecase } from '../modules/user/application/usecase/block.usecase';
import { ChangeRoleUsecase } from '../modules/user/application/usecase/changeRole.usecase';
import { DeactivateUsecase } from '../modules/user/application/usecase/deactivate.usecase';
import { ForgotPasswordUsecase } from '../modules/user/application/usecase/forgotPassword.usecase';
import { GetmeUserUsecase } from '../modules/user/application/usecase/getMeUser.usecase';
import { LoginuserUsecase } from '../modules/user/application/usecase/loginuser.usecase';
import { LogoutUsecase } from '../modules/user/application/usecase/logout.usecase';
import { RefreshTokenUsecase } from '../modules/user/application/usecase/refreshToken.usecase';
import { RegisterUserUsecase } from '../modules/user/application/usecase/registerUser.usecase';
import { ResendVerificationUsecase } from '../modules/user/application/usecase/resendToken.usecase';
import { ResetPasswordUsecase } from '../modules/user/application/usecase/resetPassword.usecase';
import { SuspendUsecase } from '../modules/user/application/usecase/suspend.usecase';
import { UpdateEmailUsecase } from '../modules/user/application/usecase/updateEmail.usecase';
import { UpdateLastNameUsecase } from '../modules/user/application/usecase/updateLastName.usecase';
import { UpdateNameUsecase } from '../modules/user/application/usecase/updateName.usecase';
import { UpdatePasswordUsecase } from '../modules/user/application/usecase/UpdatePassword.usecase';
import { UpdateUsernameUsecase } from '../modules/user/application/usecase/updateUsername.usecase';
import { UpdatePhotoProfileUsecase } from '../modules/user/application/usecase/photoProfile.usecase';
import { GetUserBySlugUsecase } from '../modules/user/application/usecase/getUserBySlug.usecase';
import { GetAllUsersUsecase } from '../modules/user/application/usecase/getAllUser.usecase';
import { VerifyEmailUsecase } from '../modules/user/application/usecase/verifyEmail.usecase';
import { UserRepositoryImpl } from '../modules/user/infrastructure/db/mongo/repositories/userRepository.impl';
import { NodemailerAdapter } from '../modules/user/infrastructure/email/nodemailer.adapter';
import { AuthController } from '../modules/user/infrastructure/http/controller/auth.controller';
import { UserController } from '../modules/user/infrastructure/http/controller/user.controller';
import { UserPresenter } from '../modules/user/infrastructure/presenter/user.presenter';
import { BcryptAdapter } from '../modules/user/infrastructure/security/BcryptAdapter.adapter';
import { JwtAdapter } from '../modules/user/infrastructure/security/JwtAdapter.adapter';
import { S3Adapter } from '../shared/infrastructure/storage/s3.adapter';
import { makeAuthenticate } from '../shared/infrastructure/http/express/middleware/authenticate.middleware';
import { DeleteAvatarUsecase } from '../modules/user/application/usecase/deleteAvatar.usecase';

class Container {
  //services
  private tokenService = new JwtAdapter();
  private passwordService = new BcryptAdapter();
  private mailService = new NodemailerAdapter();
  private storageService = new S3Adapter();

  //repositories
  private userRep = new UserRepositoryImpl();

  //usecases auth
  private registerUserUC = new RegisterUserUsecase(
    this.userRep,
    this.passwordService,
    this.mailService,
  );
  private loginUserUC = new LoginuserUsecase(this.userRep, this.tokenService, this.passwordService);
  private getMeUserUC = new GetmeUserUsecase(this.userRep);
  private refreshTokenUC = new RefreshTokenUsecase(this.userRep, this.tokenService);
  private logoutUC = new LogoutUsecase(this.userRep);
  private verifyEmailUC = new VerifyEmailUsecase(this.userRep);
  private resendVerificationUC = new ResendVerificationUsecase(this.userRep, this.mailService);
  private forgotPasswordUC = new ForgotPasswordUsecase(this.userRep, this.mailService);
  private resetPasswordUC = new ResetPasswordUsecase(this.userRep, this.passwordService);
  //usecases user
  private updateNameUC = new UpdateNameUsecase(this.userRep);
  private updateLastNameUC = new UpdateLastNameUsecase(this.userRep);
  private updateUsernameUC = new UpdateUsernameUsecase(this.userRep);
  private updateEmailUC = new UpdateEmailUsecase(this.userRep, this.mailService);
  private changeRoleUC = new ChangeRoleUsecase(this.userRep);
  private deactivateUC = new DeactivateUsecase(this.userRep);
  private suspendUC = new SuspendUsecase(this.userRep);
  private blockUC = new BlockUsecase(this.userRep);
  private updatePasswordUC = new UpdatePasswordUsecase(this.userRep, this.passwordService);
  private updatePhotoProfileUC = new UpdatePhotoProfileUsecase(this.userRep, this.storageService);
  private getUserBySlugUC = new GetUserBySlugUsecase(this.userRep);
  private getAllUsersUC = new GetAllUsersUsecase(this.userRep);
  private deleteAvatarUC = new DeleteAvatarUsecase(this.userRep, this.storageService);
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
  private readonly userController = new UserController(
    this.updateNameUC,
    this.updateLastNameUC,
    this.updateUsernameUC,
    this.updateEmailUC,
    this.changeRoleUC,
    this.deactivateUC,
    this.suspendUC,
    this.blockUC,
    this.updatePasswordUC,
    this.updatePhotoProfileUC,
    this.getUserBySlugUC,
    this.getAllUsersUC,
    this.deleteAvatarUC,

    this.userPresenter,
  );

  get AuthController(): AuthController {
    return this.authController;
  }

  get UserController(): UserController {
    return this.userController;
  }

  get authenticate(): ReturnType<typeof makeAuthenticate> {
    return makeAuthenticate(this.userRep);
  }
}

export const container = new Container();
