import { RegisterUserUsecase } from '../modules/user/application/usecase/registerUser.usecase';
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
  //presenters
  private userPresenter = new UserPresenter();
  //controllers
  private authController = new AuthController(this.registerUserUC, this.userPresenter);


  get AuthController() {
    return this.authController;
  }
}

export const container = new Container();
