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
exports.list = list;
exports.markRead = markRead;
exports.getUnreadCount = getUnreadCount;
exports.getAllByUserId = getAllByUserId;
const notification_validation_1 = require("./notification.validation");
const svc = __importStar(require("./notification.service"));
// Lấy danh sách thông báo (có phân trang)
async function list(req, res) {
    const parse = notification_validation_1.listNotiSchema.safeParse(req);
    if (!parse.success) {
        return res
            .status(400)
            .json({ success: false, error: parse.error.flatten() });
    }
    const userId = req.user.id;
    const unread = parse.data.query.unread === "true";
    const limit = parse.data.query.limit ? Number(parse.data.query.limit) : 20;
    const cursor = parse.data.query.cursor;
    try {
        const data = await svc.list(userId, { unread, limit, cursor });
        // Trả về cursor của item cuối cùng để dùng cho pagination
        const nextCursor = data.length === limit ? data[data.length - 1].id : null;
        res.json({
            success: true,
            data,
            nextCursor,
            hasMore: data.length === limit,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// Đánh dấu đã đọc
async function markRead(req, res) {
    const userId = req.user.id;
    const { notificationIds } = req.body; // Array of IDs hoặc "all"
    try {
        const result = await svc.markRead(userId, notificationIds);
        res.json({
            success: true,
            message: `Đã đánh dấu ${result.count} thông báo đã đọc`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// Lấy số lượng thông báo chưa đọc
async function getUnreadCount(req, res) {
    const userId = req.user.id;
    try {
        const count = await svc.getUnreadCount(userId);
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// Lấy TẤT CẢ thông báo của user theo userId từ URL parameter
async function getAllByUserId(req, res) {
    const userId = parseInt(req.params.userId); // Lấy userId từ URL params
    // Kiểm tra userId có hợp lệ không
    if (isNaN(userId)) {
        return res.status(400).json({
            success: false,
            message: "userId không hợp lệ"
        });
    }
    try {
        const data = await svc.getAllByUserId(userId);
        res.json({
            success: true,
            data,
            total: data.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
