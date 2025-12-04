import { prisma } from "../../prisma/client";

export async function list(
    userId: number,
    opts: { unread?: boolean; limit?: number; cursor?: string }
) {
    return prisma. notification.findMany({
        where: { 
            userId, 
            ...(opts.unread === true ?  { isRead: false } : {}) 
        },
        orderBy: { createdAt: "desc" },
        take: opts.limit ?? 20,
        ...(opts.cursor
            ?  { cursor: { id: Number(opts.cursor) }, skip: 1 }
            : {}),
    });
}
// Lấy TẤT CẢ thông báo của user (không limit)
export async function getAllByUserId(userId: number) {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        // Không có take => lấy tất cả
    });
}


export async function markRead(
    userId: number,
    notificationIds: number[] | "all"
) {
    if (notificationIds === "all") {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    } else {
        return prisma.notification.updateMany({
            where: { 
                id: { in: notificationIds },
                userId 
            },
            data: { isRead: true },
        });
    }
}

export async function getUnreadCount(userId: number) {
    return prisma.notification. count({
        where: { userId, isRead: false },
    });
}
export async function markAsRead(userId: number, ids?: number[]) {
    if (ids && ids.length > 0) {
        await prisma.notification.updateMany({
            where: { userId, id: { in: ids } },
            data: { isRead: true },
        });
    } else {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    return true;
}
