"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.getAllByUserId = getAllByUserId;
exports.markRead = markRead;
exports.getUnreadCount = getUnreadCount;
exports.markAsRead = markAsRead;
const client_1 = require("../../prisma/client");
async function list(userId, opts) {
    return client_1.prisma.notification.findMany({
        where: {
            userId,
            ...(opts.unread === true ? { isRead: false } : {})
        },
        orderBy: { createdAt: "desc" },
        take: opts.limit ?? 20,
        ...(opts.cursor
            ? { cursor: { id: Number(opts.cursor) }, skip: 1 }
            : {}),
    });
}
// Lấy TẤT CẢ thông báo của user (không limit)
async function getAllByUserId(userId) {
    return client_1.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        // Không có take => lấy tất cả
    });
}
async function markRead(userId, notificationIds) {
    if (notificationIds === "all") {
        return client_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    else {
        return client_1.prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId
            },
            data: { isRead: true },
        });
    }
}
async function getUnreadCount(userId) {
    return client_1.prisma.notification.count({
        where: { userId, isRead: false },
    });
}
async function markAsRead(userId, ids) {
    if (ids && ids.length > 0) {
        await client_1.prisma.notification.updateMany({
            where: { userId, id: { in: ids } },
            data: { isRead: true },
        });
    }
    else {
        await client_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    return true;
}
