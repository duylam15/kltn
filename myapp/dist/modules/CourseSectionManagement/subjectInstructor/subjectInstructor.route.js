"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subjectInstructor_validation_1 = require("./subjectInstructor.validation");
const controller = __importStar(require("./subjectInstructor.controller"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const router = (0, express_1.Router)();
// ============ BULK OPERATIONS ============
// Bulk assign subjects to ONE teacher
router.post("/bulk-assign-subjects", (0, validate_1.default)(subjectInstructor_validation_1.bulkAssignSubjectsSchema), controller.bulkAssign);
// Bulk assign teachers to ONE subject (NEW)
router.post("/bulk-assign-teachers", (0, validate_1.default)(subjectInstructor_validation_1.bulkAssignTeachersSchema), controller.bulkAssignTeachers);
// Remove multiple teachers from a subject (NEW)
router.delete("/bulk-remove-teachers", (0, validate_1.default)(subjectInstructor_validation_1.removeTeachersSchema), controller.removeTeachersFromSubject);
// ============ SINGLE OPERATIONS ============
// Assign ONE subject to ONE teacher
router.post("/", (0, validate_1.default)(subjectInstructor_validation_1.assignSubjectSchema), controller.assign);
// List all subject assignments
router.get("/", (0, validate_1.default)(subjectInstructor_validation_1.listSubjectInstructorQuerySchema), controller.list);
// ============ QUERY BY TEACHER ============
// Get all subjects assigned to a specific teacher
router.get("/teacher/:teacherId", (0, validate_1.default)(subjectInstructor_validation_1.teacherIdParamSchema), controller.getTeacherSubjects);
// ============ QUERY BY SUBJECT ============
// Get all teachers assigned to a specific subject (NEW)
router.get("/subject/:subjectId", (0, validate_1.default)(subjectInstructor_validation_1.subjectIdParamSchema), controller.getSubjectTeachers);
// ============ SPECIFIC ASSIGNMENT ============
// Get specific assignment detail
router.get("/:subjectId/:teacherId", (0, validate_1.default)(subjectInstructor_validation_1.subjectInstructorParamSchema), controller.detail);
// Update specific assignment
router.patch("/:subjectId/:teacherId", (0, validate_1.default)(subjectInstructor_validation_1.updateSubjectInstructorSchema), controller.update);
// Remove specific assignment
router.delete("/:subjectId/:teacherId", (0, validate_1.default)(subjectInstructor_validation_1.subjectInstructorParamSchema), controller.remove);
exports.default = router;
