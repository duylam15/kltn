import { Request, Response } from "express";
import * as service from "./attendanceSession.service";

export const create = async (req: Request, res: Response) => {
    const { sectionId, expiresAt } = req.body;
    const session = await service.createSession({ sectionId, expiresAt });
    res.json({ success: true, data: session });
};

export const getBySection = async (req: Request, res: Response) => {
    const sectionId = Number(req.params.sectionId);
    const sessions = await service.getSessionsBySection(sectionId);
    res.json({ success: true, data: sessions });
};

export const getById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const session = await service.getSessionById(id);
    res.json({ success: true, data: session });
};

export const update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const session = await service.updateSession(id, req.body);
    res.json({ success: true, data: session });
};

export const remove = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await service.deleteSession(id);
    res.json({ success: true, message: "Xóa thành công" });
};
