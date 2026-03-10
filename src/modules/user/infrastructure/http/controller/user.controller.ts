import { Request, Response } from 'express';
import { asyncHandler } from '../../../../../shared/infrastructure/http/asyncHandler';
import { UpdateEmailUsecase } from '../../../application/usecase/updateEmail.usecase';
import { UpdateLastNameUsecase } from '../../../application/usecase/updateLastName.usecase';
import { UpdateNameUsecase } from '../../../application/usecase/updateName.usecase';
import { UpdateUsernameUsecase } from '../../../application/usecase/updateUsername.usecase';
import { UserPresenter } from '../../presenter/user.presenter';

export class UserController {
  constructor(
    private readonly updateNameUC: UpdateNameUsecase,
    private readonly updateLastNameUC: UpdateLastNameUsecase,
    private readonly updateUsernameUC: UpdateUsernameUsecase,
    private readonly updateEmailUC: UpdateEmailUsecase,
    private readonly userPresenter: UserPresenter,
  ) {}

  updateName = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    const user = await this.updateNameUC.execute(req.user!.sub, { name });

    res.status(200).json({
      message: 'Name updated successfully',
      data: this.userPresenter.one(user),
    });
  });

  updateLastName = asyncHandler(async (req: Request, res: Response) => {
    const { lastName } = req.body;
    const user = await this.updateLastNameUC.execute(req.user!.sub, { lastName });

    res.status(200).json({
      message: 'Last name updated successfully',
      data: this.userPresenter.one(user),
    });
  });

  updateUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.body;
    const user = await this.updateUsernameUC.execute(req.user!.sub, { username });

    res.status(200).json({
      message: 'Username updated successfully',
      data: this.userPresenter.one(user),
    });
  });

  updateEmail = asyncHandler(async (req: Request, res: Response) => {
    const { newEmail } = req.body;

    const user = await this.updateEmailUC.execute(req.user!.sub, { newEmail });

    res.status(200).json({
      message: 'Email updated successfully. Please verify your new email address.',
      data: this.userPresenter.one(user),
    });
  });
}
