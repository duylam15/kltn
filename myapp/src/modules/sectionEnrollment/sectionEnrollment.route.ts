import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createSectionEnrollmentSchema,
    listSectionEnrollmentQuerySchema,
    sectionEnrollmentIdParamSchema,
    updateSectionEnrollmentSchema,
} from "./sectionEnrollment.validation";
import * as controller from "./sectionEnrollment.controller";

const router = Router();

// CRUD cơ bản
router.post("/", validate(createSectionEnrollmentSchema), controller.create);
router.get("/", validate(listSectionEnrollmentQuerySchema), controller.list);
router.get("/:id", validate(sectionEnrollmentIdParamSchema), controller.detail);
router.patch(
    "/:id",
    validate(updateSectionEnrollmentSchema),
    controller.update
);
router.delete(
    "/:id",
    validate(sectionEnrollmentIdParamSchema),
    controller.remove
);

// Lấy tất cả course mà 1 student đã đăng ký
router.get("/student/:studentId/courses", controller.getCoursesByStudent);

// 🔥 Các route mới liên quan đến Section / Group

// Tất cả sinh viên trong 1 section
router.get("/section/:sectionId/students", controller.getStudentsBySection);

// Tất cả sinh viên trong 1 group
router.get(
    "/section/:sectionId/groups/:groupId/students",
    controller.getStudentsByGroup
);

// Gán sinh viên vào group
router.patch("/:studentId/assign-group", controller.assignStudentToGroup);

// Xóa sinh viên khỏi group
router.patch("/:enrollmentId/remove-group", controller.removeStudentFromGroup);

// Lấy tất cả group của 1 section kèm thành viên
router.get("/section/:sectionId/groups", controller.getGroupsWithMembers);

// Tất cả section mà 1 student tham gia (có group nếu có)
router.get("/student/:studentId/sections", controller.getSectionsByStudent);

// Lấy tất cả lớp mà sinh viên (đang đăng nhập)
router.get("/by-user/:userId", controller.listCoursesByUserId);


export default router;
