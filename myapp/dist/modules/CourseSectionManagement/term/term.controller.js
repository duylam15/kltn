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
const termService = __importStar(require("./term.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    const term = await termService.createTerm(req.body);
    (0, response_1.sendResponse)(res, { success: true, message: "Term created", data: term }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { q } = req.query;
    const result = await termService.listTerms({
        page,
        limit,
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
    const term = await termService.getTerm(id);
    if (!term)
        return next(new ApiError_1.default(404, "Term not found"));
    (0, response_1.sendResponse)(res, { success: true, data: term });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await termService.getTerm(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Term not found"));
    const updated = await termService.updateTerm(id, req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Term updated",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await termService.getTerm(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Term not found"));
    await termService.deleteTerm(id);
    (0, response_1.sendResponse)(res, { success: true, message: "Term deleted" });
});
