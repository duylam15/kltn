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
exports.getBySubmission = getBySubmission;
exports.getById = getById;
exports.update = update;
const service = __importStar(require("./submissionAnswer.service"));
async function getBySubmission(req, res) {
    try {
        const { params } = req.validated;
        const results = await service.getResultsBySubmission(Number(params.submissionId));
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy kết quả code",
        });
    }
}
async function getById(req, res) {
    try {
        const { params } = req.validated;
        const result = await service.getResultById(Number(params.id));
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả",
            });
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy kết quả code",
        });
    }
}
async function update(req, res) {
    try {
        const { params, body } = req.validated;
        const id = Number(params.id);
        const updated = await service.updateSubmissionAnswer(id, {
            essayAnswer: body.essayAnswer,
            codeAnswer: body.codeAnswer,
            language: body.language,
            filePath: body.filePath,
            isFolder: body.isFolder,
            selectedChoices: body.selectedChoices,
            score: body.score !== undefined ? Number(body.score) : undefined,
            maxScore: body.maxScore !== undefined ? Number(body.maxScore) : undefined,
            judgeStatus: body.judgeStatus,
            compileLog: body.compileLog,
            stdoutLog: body.stdoutLog,
            stderrLog: body.stderrLog,
            testResults: body.testResults,
        });
        return res.json({
            success: true,
            message: "Đã cập nhật câu trả lời.",
            data: updated,
        });
    }
    catch (error) {
        console.error("❌ Error updating submission answer:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi cập nhật câu trả lời",
        });
    }
}
