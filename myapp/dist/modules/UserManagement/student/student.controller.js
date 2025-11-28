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
exports.getStudentByUserId = exports.remove = exports.update = exports.detail = exports.list = exports.create = exports.getStudentByStudentCode = void 0;
const studentService = __importStar(require("./student.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const client_1 = require("../../../prisma/client");
exports.getStudentByStudentCode = (0, catchAsync_1.default)(async (req, res, next) => {
    const studentCode = req.params.studentCode;
    if (!studentCode) {
        return next(new ApiError_1.default(400, "studentCode is required"));
    }
    const student = await studentService.getStudentByStudentCode(studentCode);
    if (!student) {
        return next(new ApiError_1.default(404, "Student not found with this studentCode"));
    }
    (0, response_1.sendResponse)(res, { success: true, data: student });
});
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    const s = await studentService.createStudent(req.body);
    (0, response_1.sendResponse)(res, { success: true, message: "Student created", data: s }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { status, major, q } = req.query;
    const result = await studentService.listStudents({
        page,
        limit,
        status,
        major,
        q,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});
exports.detail = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const s = await studentService.getStudent(id);
    if (!s)
        return next(new ApiError_1.default(404, "Student not found"));
    (0, response_1.sendResponse)(res, { success: true, data: s });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await studentService.getStudent(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Student not found"));
    // Tách phần studentData
    const { fullName, email, phoneNumber, ...studentData } = req.body;
    const updated = await client_1.prisma.student.update({
        where: { id },
        data: {
            ...studentData,
            user: {
                update: { fullName, email, phoneNumber },
            },
        },
        include: { user: true },
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Student updated",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await studentService.getStudent(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Student not found"));
    await studentService.deleteStudent(id);
    (0, response_1.sendResponse)(res, { success: true, message: "Student deleted" });
});
exports.getStudentByUserId = (0, catchAsync_1.default)(async (req, res, next) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId))
        return next(new ApiError_1.default(400, "Invalid userId"));
    const student = await client_1.prisma.student.findUnique({
        where: { userId },
        select: {
            id: true,
            userId: true,
            studentCode: true,
            user: { select: { id: true, fullName: true, email: true } }
        }
    });
    if (!student)
        return next(new ApiError_1.default(404, "Student not found for this user"));
    (0, response_1.sendResponse)(res, { success: true, data: student });
});
