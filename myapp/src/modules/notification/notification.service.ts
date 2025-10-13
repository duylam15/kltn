import { prisma } from "@/prisma/client";

export async function list(
    userId: number,
    opts: { unread?: boolean; limit?: number; cursor?: string }
) {
    return prisma.notification.findMany({
        where: { userId, ...(opts.unread === true ? { isRead: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: opts.limit ?? 20,
        ...(opts.cursor
            ? { cursor: { id: Number(opts.cursor) }, skip: 1 }
            : {}),
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
