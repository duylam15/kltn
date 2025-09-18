import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createTermSchema,
    listTermQuerySchema,
    termIdParamSchema,
    updateTermSchema,
} from "./term.validation";
import * as controller from "./term.controller";

const router = Router();

router.post("/", validate(createTermSchema), controller.create);
router.get("/", validate(listTermQuerySchema), controller.list);
router.get("/:id", validate(termIdParamSchema), controller.detail);
router.patch("/:id", validate(updateTermSchema), controller.update);
router.delete("/:id", validate(termIdParamSchema), controller.remove);

export default router;
