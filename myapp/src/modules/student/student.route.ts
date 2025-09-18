import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createStudentSchema,
    listStudentQuerySchema,
    studentIdParamSchema,
    updateStudentSchema,
} from "./student.validation";
import * as controller from "./student.controller";

// import { authenticate, requireRole } from '../../middlewares/auth';

const router = Router();

// router.use(authenticate);
// router.use(requireRole('admin')); // hoặc teacher tùy logic

router.post("/", validate(createStudentSchema), controller.create);
router.get("/", validate(listStudentQuerySchema), controller.list);
router.get("/:id", validate(studentIdParamSchema), controller.detail);
router.patch("/:id", validate(updateStudentSchema), controller.update);
router.delete("/:id", validate(studentIdParamSchema), controller.remove);

export default router;
