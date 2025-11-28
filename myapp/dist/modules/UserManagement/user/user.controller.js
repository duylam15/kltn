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
exports.remove = exports.update = exports.detail = exports.list = exports.create = void 0;
const userService = __importStar(require("./user.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    // map lại field từ client nếu vẫn gửi full_name:
    const mapped = {
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.full_name ?? req.body.fullName,
        roleName: req.body.role_name ?? req.body.roleName,
        avatarUrl: req.body.avatar_url ?? req.body.avatarUrl,
        phone: req.body.phone,
        dateOfBirth: req.body.date_of_birth ?? req.body.dateOfBirth,
        address: req.body.address,
    };
    const user = await userService.createUser(mapped);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "User created",
        data: { id: user.id, email: user.email },
    }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { role, active, q } = req.query;
    const result = await userService.listUsers({
        page,
        limit,
        role,
        active,
        q,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items.map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role?.name,
            isActive: u.isActive,
            createdAt: u.createdAt,
        })),
        meta: { page, limit, total: result.total },
    });
});
exports.detail = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const user = await userService.getUser(id);
    if (!user)
        return next(new ApiError_1.default(404, "User not found"));
    (0, response_1.sendResponse)(res, {
        success: true,
        data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role?.name,
            isActive: user.isActive,
            student: user.student,
            teacher: user.teacher,
        },
    });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id); // hoặc để nguyên string nếu User.id là cuid
    const existing = await userService.getUser(id);
    if (!existing)
        return next(new ApiError_1.default(404, "User not found"));
    const mapped = {
        email: req.body.email,
        fullName: req.body.full_name ?? req.body.fullName,
        avatarUrl: req.body.avatar_url ?? req.body.avatarUrl,
        phone: req.body.phone,
        dateOfBirth: req.body.date_of_birth ?? req.body.dateOfBirth,
        address: req.body.address,
        isActive: typeof req.body.is_active === "boolean"
            ? req.body.is_active
            : req.body.isActive,
    };
    // lọc field undefined
    const cleaned = Object.fromEntries(Object.entries(mapped).filter(([_, v]) => v !== undefined && v !== null));
    const updated = await userService.updateUser(id, cleaned);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "User updated",
        data: {
            id: updated.id,
            email: updated.email,
            fullName: updated.fullName,
            phone: updated.phone,
        },
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const existing = await userService.getUser(id);
    if (!existing)
        return next(new ApiError_1.default(404, "User not found"));
    await userService.deleteUser(id);
    (0, response_1.sendResponse)(res, { success: true, message: "User deleted" });
});
