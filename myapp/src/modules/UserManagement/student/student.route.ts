import { Router } from "express";
import {
    createStudentSchema,
    listStudentQuerySchema,
    studentIdParamSchema,
    updateStudentSchema,
} from "./student.validation";
import * as controller from "./student.controller";
import validate from "@/middlewares/validate";

// import { authenticate, requireRole } from '../../middlewares/auth';

const router = Router();

// router.use(authenticate);
// router.use(requireRole('admin')); // hoặc teacher tùy logic

router.post("/", validate(createStudentSchema), controller.create);
// router.get(
//     "/",
//     requireAuth, // phải login
//     // requirePermission("student", "read"), // cần quyền student.read
//     validate(listStudentQuerySchema), // validate query
//     controller.list // controller xử lý
// );
router.get("/", validate(listStudentQuerySchema), controller.list);

router.get("/:id", validate(studentIdParamSchema), controller.detail);
router.patch("/:id", validate(updateStudentSchema), controller.update);
router.delete("/:id", validate(studentIdParamSchema), controller.remove);

// Lấy thông tin sinh viên theo userId
router.get("/user/:userId", controller.getStudentByUserId);

// Lấy sinh viên theo studentCode (MSSV)
router.get("/code/:studentCode", controller.getStudentByStudentCode);

export default router;
