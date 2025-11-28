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
exports.getUserChaptersBySubject = exports.getUserSubjects = exports.getQuestionsByUserId = exports.getChapters = exports.getById = exports.remove = exports.update = exports.getAllQuestions = exports.getMineAndPublicQuestions = exports.create = void 0;
exports.getPublicQuestions = getPublicQuestions;
const service = __importStar(require("./questions.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
// question.controller.ts
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    const { body } = req.validated;
    const question = await service.createQuestion(body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Question created successfully",
        data: question,
    }, 201);
});
async function getPublicQuestions(req, res, next) {
    try {
        const filter = req.query || {};
        const result = await service.getPublicQuestions(filter);
        return res.status(200).json(result);
    }
    catch (err) {
        return next(err);
    }
}
exports.getMineAndPublicQuestions = (0, catchAsync_1.default)(async (req, res) => {
    const { params, query } = req.validated;
    const userId = Number(params.userId);
    console.log("📊 Get mine + public questions:", {
        userId,
        page: query.page,
        limit: query.limit,
        subjectId: query.subjectId,
        chapterId: query.chapterId,
        difficulty: query.difficulty,
        type: query.type,
        search: query.search || query.q,
    });
    const result = await service.getMineAndPublicQuestions(userId, query);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});
// ... các handler khác (create, getById, getAllQuestions, ...) giữ nguyên
// 🆕 CẬP NHẬT: Thêm log debug
exports.getAllQuestions = (0, catchAsync_1.default)(async (req, res) => {
    const { query } = req.validated;
    // Debug log
    console.log("📊 Filter params received:", {
        page: query.page,
        limit: query.limit,
        subjectId: query.subjectId,
        chapterId: query.chapterId,
        difficulty: query.difficulty,
        type: query.type,
        search: query.search || query.q,
    });
    const result = await service.getAllQuestions(query);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});
exports.update = (0, catchAsync_1.default)(async (req, res) => {
    const { body, params } = req.validated;
    const question = await service.updateQuestion(Number(params.id), body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Question updated successfully",
        data: question,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res) => {
    const { params } = req.validated;
    await service.deleteQuestion(Number(params.id));
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Question deleted successfully",
    });
});
exports.getById = (0, catchAsync_1.default)(async (req, res) => {
    const { params } = req.validated;
    const data = await service.getQuestionById(Number(params.id));
    (0, response_1.sendResponse)(res, {
        success: true,
        data,
    });
});
exports.getChapters = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const chapters = await service.getChaptersBySubject(id);
    (0, response_1.sendResponse)(res, { success: true, data: chapters });
});
// 🆕 Controller: Lấy câu hỏi của giảng viên theo userId
exports.getQuestionsByUserId = (0, catchAsync_1.default)(async (req, res) => {
    const { params, query } = req.validated;
    const userId = Number(params.userId);
    console.log("📊 Get Questions by UserId:", {
        userId,
        page: query.page,
        limit: query.limit,
        subjectId: query.subjectId,
        chapterId: query.chapterId,
        difficulty: query.difficulty,
        type: query.type,
        search: query.search || query.q,
    });
    const result = await service.getQuestionsByUserId(userId, query);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    });
});
// 🆕 Controller: Lấy môn học có câu hỏi của user
exports.getUserSubjects = (0, catchAsync_1.default)(async (req, res) => {
    const { params } = req.validated;
    const userId = Number(params.userId);
    const subjects = await service.getUserSubjects(userId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: subjects,
    });
});
// 🆕 Controller: Lấy chương theo môn học của user
exports.getUserChaptersBySubject = (0, catchAsync_1.default)(async (req, res) => {
    const { params } = req.validated;
    const userId = Number(params.userId);
    const subjectId = Number(params.subjectId);
    const chapters = await service.getUserChaptersBySubject(userId, subjectId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: chapters,
    });
});
