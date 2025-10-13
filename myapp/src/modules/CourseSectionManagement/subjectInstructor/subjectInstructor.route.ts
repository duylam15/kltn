import { Router } from "express";
import {
    assignSubjectSchema,
    listSubjectInstructorQuerySchema,
    subjectInstructorParamSchema,
    updateSubjectInstructorSchema,
    teacherIdParamSchema,
    bulkAssignSubjectsSchema,
    bulkAssignTeachersSchema, // Thêm
    subjectIdParamSchema, // Thêm
    removeTeachersSchema, // Thêm
} from "./subjectInstructor.validation";
import * as controller from "./subjectInstructor.controller";
import validate from "@/middlewares/validate";

const router = Router();

// ============ BULK OPERATIONS ============

// Bulk assign subjects to ONE teacher
router.post(
    "/bulk-assign-subjects",
    validate(bulkAssignSubjectsSchema),
    controller.bulkAssign
);

// Bulk assign teachers to ONE subject (NEW)
router.post(
    "/bulk-assign-teachers",
    validate(bulkAssignTeachersSchema),
    controller.bulkAssignTeachers
);

// Remove multiple teachers from a subject (NEW)
router.delete(
    "/bulk-remove-teachers",
    validate(removeTeachersSchema),
    controller.removeTeachersFromSubject
);

// ============ SINGLE OPERATIONS ============

// Assign ONE subject to ONE teacher
router.post("/", validate(assignSubjectSchema), controller.assign);

// List all subject assignments
router.get("/", validate(listSubjectInstructorQuerySchema), controller.list);

// ============ QUERY BY TEACHER ============

// Get all subjects assigned to a specific teacher
router.get(
    "/teacher/:teacherId",
    validate(teacherIdParamSchema),
    controller.getTeacherSubjects
);

// ============ QUERY BY SUBJECT ============

// Get all teachers assigned to a specific subject (NEW)
router.get(
    "/subject/:subjectId",
    validate(subjectIdParamSchema),
    controller.getSubjectTeachers
);

// ============ SPECIFIC ASSIGNMENT ============

// Get specific assignment detail
router.get(
    "/:subjectId/:teacherId",
    validate(subjectInstructorParamSchema),
    controller.detail
);

// Update specific assignment
router.patch(
    "/:subjectId/:teacherId",
    validate(updateSubjectInstructorSchema),
    controller.update
);

// Remove specific assignment
router.delete(
    "/:subjectId/:teacherId",
    validate(subjectInstructorParamSchema),
    controller.remove
);

export default router;
