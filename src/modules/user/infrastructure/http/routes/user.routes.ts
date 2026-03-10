import { Router } from "express";
import { container } from "../../../../../config/container";
import { authenticate } from "../../../../../shared/infrastructure/http/express/middleware/authenticate.middleware";
import { validate } from "../../../../../shared/infrastructure/http/express/middleware/validateBody.middleware";

import { UpdateLastNameSchema } from "../../../application/dto/updateLastName.dto";
import { UpdateNameSchema } from "../../../application/dto/updateName.dto";
import { UpdateUsernameSchema } from "../../../application/dto/updateUsername.dto";
import { UpdateEmailSchema } from "../../../application/dto/updateEmail.dto";
import { IsAdmin, IsSuperAdmin } from "../../../../../shared/infrastructure/http/express/middleware/authorize.middleware";
import { ChangeRoleLimitedSchema, ChangeRoleSchema } from "../../../application/dto/changeRole.dto";
import { ChangeStatusSchema } from "../../../application/dto/changeStatus.dto";
import { StatusBlockSchema } from "../../../application/dto/statusBlock.dto";
import { UpdatePasswordSchema } from "../../../application/dto/updatePassword.dto";


export const userRoutes = Router();

const user = container.UserController;

userRoutes.patch('/name', authenticate, validate(UpdateNameSchema), user.updateName)
userRoutes.patch('/last-name', authenticate, validate(UpdateLastNameSchema), user.updateLastName)
userRoutes.patch('/username', authenticate, validate(UpdateUsernameSchema), user.updateUsername)
userRoutes.patch('/email', authenticate, validate(UpdateEmailSchema), user.updateEmail)
userRoutes.patch('/:id/role', authenticate, IsAdmin, validate(ChangeRoleLimitedSchema), user.changeRole)
userRoutes.patch('/:id/role/admin', authenticate, IsSuperAdmin, validate(ChangeRoleSchema), user.changeRole)
userRoutes.patch('/:id/status/deactivate', authenticate, IsAdmin, validate(ChangeStatusSchema), user.deactivate)
userRoutes.patch('/:id/status/suspend', authenticate, IsAdmin, validate(ChangeStatusSchema), user.suspend)
userRoutes.patch('/:id/status/block', authenticate, IsSuperAdmin, validate(StatusBlockSchema), user.block)
userRoutes.patch('/password', authenticate, validate(UpdatePasswordSchema), user.updatePassword)