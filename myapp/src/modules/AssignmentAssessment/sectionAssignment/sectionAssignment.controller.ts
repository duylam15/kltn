import { Request, Response } from "express";
import * as service from "./sectionAssignment.service";

export async function toggleVisibility(req: Request, res: Response) {
    try {
        const { sectionId, assignmentId } = req.params;
        const { isOpen } = req.body;

        const updated = await service.updateAssignmentVisibility(
            Number(sectionId),
            Number(assignmentId),
            Boolean(isOpen)
        );

        return res.json({
            success: true,
            message: `Assignment visibility updated`,
            data: updated,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export async function assignToSection(req: Request, res: Response) {
    const sectionId = Number(req.params.id);
    const { assignmentId } = (req as any).validated.body;
    try {
        const sa = await service.assignToSection(sectionId, assignmentId);
        res.json({ success: true, data: sa });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function unassignFromSection(req: Request, res: Response) {
    const sectionId = Number(req.params.id);
    const assignmentId = Number(req.params.assignmentId);
    try {
        await service.unassignFromSection(sectionId, assignmentId);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function listBySection(req: Request, res: Response) {
    const sectionId = Number(req.params.id);
    try {
        const data = await service.listBySection(sectionId);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function listByAssignment(req: Request, res: Response) {
    const assignmentId = Number(req.params.id);
    try {
        const data = await service.listByAssignment(assignmentId);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}
