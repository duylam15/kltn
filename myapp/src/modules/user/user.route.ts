import { Router } from "express";
import * as userController from "./user.controller";
import { validate } from "../../middlewares/validate";
import {
    createUserSchema,
    userIdParamSchema,
    updateUserSchema,
} from "./user.validation";

const router = Router();

router
    .route("/")
    .post(validate(createUserSchema), userController.create)
    .get(userController.list);

router
    .route("/:id")
    .get(validate(userIdParamSchema), userController.detail)
    .patch(validate(updateUserSchema), userController.update)
    .delete(validate(userIdParamSchema), userController.remove);

export default router;
