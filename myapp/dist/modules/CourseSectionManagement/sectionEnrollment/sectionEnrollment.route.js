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
const sectionEnrollment_validation_1 = require("./sectionEnrollment.validation");
const controller = __importStar(require("./sectionEnrollment.controller"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const router = (0, express_1.Router)();
// CRUD cơ bản
router.post("/", (0, validate_1.default)(sectionEnrollment_validation_1.createSectionEnrollmentSchema), controller.create);
router.get("/", (0, validate_1.default)(sectionEnrollment_validation_1.listSectionEnrollmentQuerySchema), controller.list);
router.get("/:id", (0, validate_1.default)(sectionEnrollment_validation_1.sectionEnrollmentIdParamSchema), controller.detail);
router.patch("/:id", (0, validate_1.default)(sectionEnrollment_validation_1.updateSectionEnrollmentSchema), controller.update);
router.delete("/:id", (0, validate_1.default)(sectionEnrollment_validation_1.sectionEnrollmentIdParamSchema), controller.remove);
// Lấy tất cả course mà 1 student đã đăng ký
router.get("/student/:studentId/courses", controller.getCoursesByStudent);
// 🔥 Các route mới liên quan đến Section / Group
// Tất cả sinh viên trong 1 section
router.get("/section/:sectionId/students", controller.getStudentsBySection);
// Tất cả sinh viên trong 1 group
router.get("/section/:sectionId/groups/:groupId/students", controller.getStudentsByGroup);
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
exports.default = router;
