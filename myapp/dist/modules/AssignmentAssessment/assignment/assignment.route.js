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
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const validation = __importStar(require("./assignment.validation"));
const controller = __importStar(require("./assignment.controller"));
const assignment_service_1 = require("./assignment.service");
const router = (0, express_1.Router)();
router.get("/:assignmentId/student/:studentId/submissions", async (req, res) => {
    try {
        const assignmentId = Number(req.params.assignmentId);
        const studentId = Number(req.params.studentId);
        if (isNaN(assignmentId) || isNaN(studentId)) {
            return res
                .status(400)
                .json({ success: false, message: "ID không hợp lệ" });
        }
        const submissions = await (0, assignment_service_1.getSubmissionsByStudentAndAssignment)(studentId, assignmentId);
        res.json({ success: true, data: submissions });
    }
    catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});
router.get("/public", async (req, res) => {
    try {
        const data = await (0, assignment_service_1.getPublicAssignments)();
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});
// Admin/Teacher
router.post("/", (0, validate_1.default)(validation.createAssignmentSchema), controller.create);
router.put("/:id", (0, validate_1.default)(validation.updateAssignmentSchema), controller.update);
router.delete("/:id", (0, validate_1.default)(validation.deleteAssignmentSchema), controller.remove);
router.get("/", (0, validate_1.default)(validation.listAssignmentsSchema), controller.list);
router.get("/:id", (0, validate_1.default)(validation.getAssignmentByIdSchema), controller.getById);
router.get("/:id/best-submissions", controller.getBestSubmissions);
router.get("/:id/submissions", (0, validate_1.default)(validation.listSubmissionsByAssignmentSchema), controller.submissions);
router.get("/teacher/:teacherId", controller.getAssignmentsByTeacher);
router.get("/sections/:sectionId/assignments", controller.bySection);
// Student Routes
router.get("/section/:sectionId/student/:studentId", controller.getAssignmentsBySectionForStudent);
router.post("/:id/start", controller.start);
router.post("/:id/submit", controller.submit);
// Student submit code (single file)
router.post("/:id/submit-code", controller.submitCode);
// Student submit folder (zip)
router.post("/:id/submit-project", controller.submitProject);
// Get answer status
router.get("/answer/:answerId/status", controller.getAnswerStatus);
// Gợi ý lộ trình học tập sau khi làm xong assignment
router.post("/:id/recommend-path", controller.recommendPath);
router.get("/suggest/cluster", controller.clusterStudents);
router.get("/answers/:answerId/result", controller.getAnswerResult);
exports.default = router;
