import { Request, Response } from 'express';
import { asyncHandler } from '../../../../../shared/infrastructure/http/asyncHandler';
import { UpdateEmailUsecase } from '../../../application/usecase/updateEmail.usecase';
import { UpdateLastNameUsecase } from '../../../application/usecase/updateLastName.usecase';
import { UpdateNameUsecase } from '../../../application/usecase/updateName.usecase';
import { UpdateUsernameUsecase } from '../../../application/usecase/updateUsername.usecase';
import { UserPresenter } from '../../presenter/user.presenter';
import { ChangeRoleUsecase } from '../../../application/usecase/changeRole.usecase';
import { DeactivateUsecase } from '../../../application/usecase/deactivate.usecase';
import { SuspendUsecase } from '../../../application/usecase/suspend.usecase';
import { BlockUsecase } from '../../../application/usecase/block.usecase';
import { Role } from '../../../domain/entities/user.entity';
import { UpdatePasswordUsecase } from '../../../application/usecase/UpdatePassword.usecase';

export class UserController {
  constructor(
    private readonly updateNameUC: UpdateNameUsecase,
    private readonly updateLastNameUC: UpdateLastNameUsecase,
    private readonly updateUsernameUC: UpdateUsernameUsecase,
    private readonly updateEmailUC: UpdateEmailUsecase,
    private readonly changeRoleUC: ChangeRoleUsecase,
    private readonly deactivateUC: DeactivateUsecase,
    private readonly suspendUC: SuspendUsecase,
    private readonly blockUC: BlockUsecase,
    private readonly updatePasswordUC: UpdatePasswordUsecase,
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

  changeRole = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const { role } = req.body;

    const user = await this.changeRoleUC.execute({ id: id as string, role });
    res.status(200).json({
      message: 'Role updated successfully',
      data: this.userPresenter.one(user),
    });
  })

  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const user = await this.deactivateUC.execute({ id: id as string }, req.user!.role as Role);
    res.status(200).json({
      message: 'User deactivated successfully',
      data: this.userPresenter.one(user),
    });

  })

  suspend = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;

    const user = await this.suspendUC.execute({ id: id as string }, req.user!.role as Role);
    res.status(200).json({
      message: 'User suspended successfully',
      data: this.userPresenter.one(user),
    });
  })

  block = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const {reason} = req.body;

    const user = await this.blockUC.execute({ id: id as string, reason }, req.user!.role as Role);
    res.status(200).json({
      message: 'User blocked successfully',
      data: this.userPresenter.one(user),
    });
  })

  updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await this.updatePasswordUC.execute(req.user!.sub, { currentPassword, newPassword });

    res.status(200).json({
      message: 'Password updated successfully',
      data: this.userPresenter.one(user),
    });
  })
}
