import { Request, Response } from "express";
import * as service from "./questionChoice.service";

export async function create(req: Request, res: Response) {
    const { params, body } = (req as any).validated;
    const choice = await service.createChoice(Number(params.questionId), body);
    res.json({ success: true, data: choice });
}

export async function update(req: Request, res: Response) {
    const { params, body } = (req as any).validated;
    const choice = await service.updateChoice(Number(params.id), body);
    res.json({ success: true, data: choice });
}

export async function remove(req: Request, res: Response) {
    const { params } = (req as any).validated;
    await service.deleteChoice(Number(params.id));
    res.json({ success: true });
}
