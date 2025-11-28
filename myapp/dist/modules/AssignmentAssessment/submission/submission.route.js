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
const controller = __importStar(require("./submission.controller"));
const validation = __importStar(require("./submission.validation"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const router = (0, express_1.Router)();
// 🗂️ Lấy tất cả bài nộp (admin)
router.get("/", controller.getAll);
// 📘 Lịch sử nộp bài của 1 student trong 1 assignment
router.get("/assignment/:assignmentId/student/:studentId", (0, validate_1.default)(validation.getHistorySchema), controller.getHistory);
// 🏆 Bài nộp điểm cao nhất của 1 student trong 1 assignment
router.get("/assignment/:assignmentId/student/:studentId/best", (0, validate_1.default)(validation.getBestSchema), controller.getBest);
// 📘 Chi tiết 1 lần nộp cụ thể
router.get("/:id", (0, validate_1.default)(validation.getByIdSchema), controller.getById);
// 🆕 Tạo bài nộp mới
router.post("/", (0, validate_1.default)(validation.createSchema), controller.create);
// ✏️ Cập nhật bài nộp (điểm, feedback,...)
router.put("/:id", (0, validate_1.default)(validation.updateSchema), controller.update);
// ❌ Xoá bài nộp
router.delete("/:id", (0, validate_1.default)(validation.deleteSchema), controller.remove);
exports.default = router;
