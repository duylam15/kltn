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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = getHistory;
exports.getById = getById;
exports.getBest = getBest;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.getAll = getAll;
const service = __importStar(require("./submission.service"));
/**
 * 📘 Lấy lịch sử nộp bài của 1 student trong 1 assignment
 */
async function getHistory(req, res) {
    const { params } = req.validated;
    const submissions = await service.getSubmissionsHistory(Number(params.assignmentId), Number(params.studentId));
    res.json({ success: true, data: submissions });
}
/**
 * 📘 Lấy chi tiết 1 bài nộp
 */
async function getById(req, res) {
    const { params } = req.validated;
    const submission = await service.getSubmissionById(Number(params.id));
    res.json({ success: true, data: submission });
}
/**
 * 🏆 Lấy bài nộp có điểm cao nhất của 1 student trong 1 assignment
 */
async function getBest(req, res) {
    const { params } = req.validated;
    const submission = await service.getBestSubmission(Number(params.assignmentId), Number(params.studentId));
    res.json({ success: true, data: submission });
}
/**
 * 🆕 Tạo bài nộp mới
 */
async function create(req, res) {
    const { body } = req.validated;
    const newSubmission = await service.createSubmission(body);
    res.json({ success: true, data: newSubmission });
}
/**
 * ✏️ Cập nhật bài nộp (chấm điểm, feedback, autoGraded...)
 */
async function update(req, res) {
    const { params, body } = req.validated;
    const updated = await service.updateSubmission(Number(params.id), body);
    res.json({ success: true, data: updated });
}
/**
 * ❌ Xoá bài nộp
 */
async function remove(req, res) {
    const { params } = req.validated;
    await service.deleteSubmission(Number(params.id));
    res.json({ success: true, message: "Deleted successfully" });
}
/**
 * 🗂️ Lấy tất cả bài nộp (admin xem)
 */
async function getAll(req, res) {
    const submissions = await service.getAllSubmissions();
    res.json({ success: true, data: submissions });
}
