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
const validation = __importStar(require("./questions.validation"));
const controller = __importStar(require("./questions.controller"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const router = (0, express_1.Router)();
// Admin/Teacher
router.post("/", (0, validate_1.default)(validation.createQuestionSchema), controller.create);
router.get("/public", controller.getPublicQuestions);
// 🆕 API lấy câu hỏi của giảng viên theo userId
router.get("/user/:userId", (0, validate_1.default)(validation.getQuestionsByUserIdSchema), controller.getQuestionsByUserId);
// 🆕 API lấy môn học có câu hỏi của giảng viên
router.get("/user/:userId/subjects", (0, validate_1.default)(validation.getUserSubjectsSchema), controller.getUserSubjects);
// 🆕 API lấy chương theo môn học (của câu hỏi giảng viên tạo)
router.get("/user/:userId/subjects/:subjectId/chapters", (0, validate_1.default)(validation.getUserChaptersBySubjectSchema), controller.getUserChaptersBySubject);
// API chung - lấy tất cả câu hỏi (có thể dùng cho admin)
router.get("/", (0, validate_1.default)(validation.getAllQuestionsSchema), controller.getAllQuestions);
router.put("/:id", (0, validate_1.default)(validation.updateQuestionSchema), controller.update);
router.delete("/:id", (0, validate_1.default)(validation.deleteQuestionSchema), controller.remove);
router.get("/:id", (0, validate_1.default)(validation.getQuestionByIdSchema), controller.getById);
router.get("/user/:userId/mine-and-public", (0, validate_1.default)(validation.getUserMineAndPublicSchema), controller.getMineAndPublicQuestions);
router.get("/:id/chapters", controller.getChapters);
exports.default = router;
