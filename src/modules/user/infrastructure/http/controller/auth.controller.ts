import { asyncHandler } from '../../../../../shared/infrastructure/http/asyncHandler';
import { RegisterUserUsecase } from '../../../application/usecase/registerUser.usecase';
import { UserPresenter } from '../../presenter/user.presenter';
import { Request, Response } from 'express';

export class AuthController {
  constructor(
    private readonly registerUserUC: RegisterUserUsecase,
    private readonly userPresenter: UserPresenter,
  ) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password } = req.body;
    const user = await this.registerUserUC.execute({ email, username, password });
    res.status(201).json({
      message: 'User registered successfully',
      data: this.userPresenter.one(user),
    });
  });
}
