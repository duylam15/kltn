import { Router } from "express";
import {
    createTeacherSchema,
    listTeacherQuerySchema,
    teacherIdParamSchema,
    updateTeacherSchema
} from "./teacher.validation";
import * as controller from "./teacher.controller";
import validate from "../../../middlewares/validate";

// import { authenticate, requireRole } from '../../middlewares/auth';

const router = Router();

// router.use(authenticate);
// router.use(requireRole('admin'));

router.post("/", validate(createTeacherSchema), controller.create);
router.get("/", validate(listTeacherQuerySchema), controller.list);
router.get("/:id", validate(teacherIdParamSchema), controller.detail);
router.patch("/:id", validate(updateTeacherSchema), controller.update);
router.delete("/:id", validate(teacherIdParamSchema), controller.remove);
router.get("/:teacherId/groups", controller.getAllGroupsOfTeacher);

export default router;
