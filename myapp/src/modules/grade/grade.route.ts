import { Router } from "express";
import * as gradeController from "./grade.controller";

const router = Router();

// ========== GRADE COLUMN ==========

router.post(
    "/columns/:columnId/linked-columns",
    gradeController.addColumnsToColumn
);

// Xóa cột khỏi cột tổng hợp
router.delete(
    "/columns/:columnId/linked-columns/:childColumnId",
    gradeController.removeColumnFromColumn
);

// Lấy danh sách cột trong cột tổng hợp
router.get(
    "/columns/:columnId/linked-columns",
    gradeController.getColumnsInColumn
);
// Tạo cột điểm
router.post("/columns", gradeController.createGradeColumn);

// Lấy danh sách cột điểm theo section
router.get(
    "/sections/:sectionId/columns",
    gradeController.getGradeColumnsBySection
);

// Lấy chi tiết cột điểm
router.get("/columns/:id", gradeController.getGradeColumn);

// Cập nhật cột điểm
router.put("/columns/:id", gradeController.updateGradeColumn);

// Xóa cột điểm
router.delete("/columns/:id", gradeController.deleteGradeColumn);

// Publish/Unpublish cột điểm
router.patch("/columns/:id/publish", gradeController.togglePublishGradeColumn);

// ========== GRADE COLUMN - ATTENDANCE SESSION ==========

// Thêm attendance sessions vào cột điểm
router.post(
    "/columns/:columnId/attendance-sessions",
    gradeController.addAttendanceSessionsToColumn
);

// Xóa attendance session khỏi cột điểm
router.delete(
    "/columns/:columnId/attendance-sessions/:sessionId",
    gradeController.removeAttendanceSessionFromColumn
);

// Lấy danh sách attendance sessions trong cột điểm
router.get(
    "/columns/:columnId/attendance-sessions",
    gradeController.getAttendanceSessionsInColumn
);

// ========== GRADE COLUMN - ASSIGNMENT ==========

// Thêm assignments vào cột điểm
router.post(
    "/columns/:columnId/assignments",
    gradeController.addAssignmentsToColumn
);

// Xóa assignment khỏi cột điểm
router.delete(
    "/columns/:columnId/assignments/:assignmentId",
    gradeController.removeAssignmentFromColumn
);

// Lấy danh sách assignments trong cột điểm
router.get(
    "/columns/:columnId/assignments",
    gradeController.getAssignmentsInColumn
);

// ========== STUDENT GRADE ==========

// Tính toán điểm cho sinh viên
router.post(
    "/columns/:columnId/calculate",
    gradeController.calculateStudentGrades
);

// Lấy điểm của tất cả sinh viên theo cột điểm
router.get(
    "/columns/:columnId/student-grades",
    gradeController.getStudentGradesByColumn
);

// Lấy điểm của 1 sinh viên cụ thể
router.get(
    "/columns/:columnId/students/:studentId",
    gradeController.getStudentGrade
);

// Ghi đè điểm thủ công
router.put(
    "/columns/:columnId/students/:studentId/override",
    gradeController.overrideStudentGrade
);

// Xóa ghi đè điểm
router.delete(
    "/columns/:columnId/students/:studentId/override",
    gradeController.removeGradeOverride
);

// ========== SECTION GRADE BOOK ==========

// Lấy toàn bộ bảng điểm của section
router.get(
    "/sections/:sectionId/gradebook",
    gradeController.getSectionGradeBook
);

// Lấy điểm của sinh viên trong section
router.get(
    "/sections/:sectionId/students/:studentId",
    gradeController.getStudentGradesInSection
);

// Export điểm ra CSV
router.get("/sections/:sectionId/export", gradeController.exportGrades);

export default router;
