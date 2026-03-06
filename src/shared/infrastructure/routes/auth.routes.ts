import { Router } from "express";
import { validate } from "../http/express/middleware/validateBody.middleware";
import { RegisterUserSchema } from "../../../modules/user/application/dto/registerUser.dto";
import { container } from "../../../config/container";


export const authRoutes = Router()

const auth = container.AuthController

authRoutes.post('/register', validate(RegisterUserSchema), auth.register)