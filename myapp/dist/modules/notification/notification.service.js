"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.markAsRead = markAsRead;
const client_1 = require("../../prisma/client");
async function list(userId, opts) {
    return client_1.prisma.notification.findMany({
        where: { userId, ...(opts.unread === true ? { isRead: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: opts.limit ?? 20,
        ...(opts.cursor
            ? { cursor: { id: Number(opts.cursor) }, skip: 1 }
            : {}),
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
