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
exports.selectFinalSubmission = selectFinalSubmission;
exports.updateScore = updateScore;
const service = __importStar(require("./submission.service"));
async function getHistory(req, res) {
    const { params } = req.validated;
    const submissions = await service.getSubmissionsHistory(Number(params.assignmentId), Number(params.studentId));
    res.json({ success: true, data: submissions });
}
async function getById(req, res) {
    const { params } = req.validated;
    const submission = await service.getSubmissionById(Number(params.id));
    res.json({ success: true, data: submission });
}
async function selectFinalSubmission(req, res) {
    const { params } = req.validated;
    const submissionId = Number(params.id);
    const updated = await service.setFinalSubmission(submissionId);
    return res.json({
        success: true,
        message: "Đã chọn lần nộp này làm điểm chính thức.",
        data: updated,
    });
}
// 🔥 HÀM CẬP NHẬT ĐIỂM SUBMISSION
async function updateScore(req, res) {
    try {
        const { params, body } = req.validated;
        const submissionId = Number(params.id);
        const { score, feedback } = body;
        const updated = await service.updateSubmissionScore(submissionId, {
            score: score !== undefined ? Number(score) : undefined,
            feedback: feedback || undefined,
        });
        return res.json({
            success: true,
            message: "Đã cập nhật điểm submission.",
            data: updated,
        });
    }
    catch (error) {
        console.error("Error updating submission score:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi cập nhật điểm",
        });
    }
}
