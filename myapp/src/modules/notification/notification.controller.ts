import { Request, Response } from "express";
import { listNotiSchema, markReadSchema } from "./notification.validation";
import * as svc from "./notification.service";

export async function list(req: Request, res: Response) {
    const parse = listNotiSchema.safeParse(req);
    if (!parse.success)
        return res
            .status(400)
            .json({ success: false, error: parse.error.flatten() });

    const userId = (req as any).user.id as number;
    const unread = parse.data.query.unread === "true";
    const limit = parse.data.query.limit ? Number(parse.data.query.limit) : 20;
    const cursor = parse.data.query.cursor;

    const data = await svc.list(userId, { unread, limit, cursor });
    res.json({ success: true, data });
}

export async function markRead(req: Request, res: Response) {
    const parse = markReadSchema.safeParse(req);
    if (!parse.success)
        return res
            .status(400)
            .json({ success: false, error: parse.error.flatten() });

    const userId = (req as any).user.id as number;
    await svc.markAsRead(userId, parse.data.body.ids);
    res.json({ success: true });
}
