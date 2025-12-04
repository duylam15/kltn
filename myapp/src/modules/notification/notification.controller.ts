import { Request, Response } from "express";
import { listNotiSchema, markReadSchema } from "./notification.validation";
import * as svc from "./notification.service";

// Lấy danh sách thông báo (có phân trang)
export async function list(req: Request, res: Response) {
    const parse = listNotiSchema.safeParse(req);
    if (!parse.success) {
        return res
            .status(400)
            .json({ success: false, error: parse.error.flatten() });
    }

    const userId = (req as any).user.id as number;
    const unread = parse.data.query.unread === "true";
    const limit = parse.data.query.limit ? Number(parse.data.query.limit) : 20;
    const cursor = parse.data.query.cursor;

    try {
        const data = await svc.list(userId, { unread, limit, cursor });

        // Trả về cursor của item cuối cùng để dùng cho pagination
        const nextCursor =
            data.length === limit ? data[data.length - 1].id : null;

        res.json({
            success: true,
            data,
            nextCursor,
            hasMore: data.length === limit,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Đánh dấu đã đọc
export async function markRead(req: Request, res: Response) {
    const userId = (req as any).user.id as number;
    const { notificationIds } = req.body; // Array of IDs hoặc "all"

    try {
        const result = await svc.markRead(userId, notificationIds);

        res.json({
            success: true,
            message: `Đã đánh dấu ${result.count} thông báo đã đọc`,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Lấy số lượng thông báo chưa đọc
export async function getUnreadCount(req: Request, res: Response) {
    const userId = (req as any).user.id as number;

    try {
        const count = await svc.getUnreadCount(userId);
        res.json({ success: true, data: { count } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}


// Lấy TẤT CẢ thông báo của user theo userId từ URL parameter
export async function getAllByUserId(req: Request, res: Response) {
    const userId = parseInt(req.params.userId); // Lấy userId từ URL params

    // Kiểm tra userId có hợp lệ không
    if (isNaN(userId)) {
        return res. status(400).json({ 
            success: false, 
            message: "userId không hợp lệ" 
        });
    }

    try {
        const data = await svc.getAllByUserId(userId);
        
        res. json({ 
            success: true, 
            data,
            total: data.length
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}