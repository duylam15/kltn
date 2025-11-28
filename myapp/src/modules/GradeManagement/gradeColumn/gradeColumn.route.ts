import { Router } from "express";
import * as controller from "./gradeColumn.controller";
import * as validation from "./gradeColumn.validation";
import validate from "../../../middlewares/validate";

const router = Router();

// Lấy danh sách cột điểm của section
router.get(
    "/sections/:sectionId",
    validate(validation.listColumnsSchema),
    controller.listColumnsBySection
);

// Tạo cột điểm mới
router.post(
    "/sections/:sectionId",
    validate(validation.createColumnSchema),
    controller.createColumn
);

// Cập nhật cột điểm
router.put(
    "/:id",
    validate(validation.updateColumnSchema),
    controller.updateColumn
);

// Xóa cột điểm
router.delete(
    "/:id",
    validate(validation.deleteColumnSchema),
    controller.deleteColumn
);

// Gán buổi điểm danh
router.post(
    "/:id/attendance-sessions",
    validate(validation.assignAttendanceSessionsSchema),
    controller.assignAttendanceSessions
);

// Gán bài tập
router.post(
    "/:id/assignments",
    validate(validation.assignAssignmentsSchema),
    controller.assignAssignments
);

// Tính toán lại điểm
router.post(
    "/:id/recalculate",
    validate(validation.recalculateSchema),
    controller.recalculateGrades
);

export default router;
