import { Request, Response } from "express";
import * as service from "./submission.service";

export async function getHistory(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const submissions = await service.getSubmissionsHistory(
        Number(params.assignmentId),
        Number(params.studentId)
    );
    res.json({ success: true, data: submissions });
}

export async function getById(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const submission = await service.getSubmissionById(Number(params.id));
    res.json({ success: true, data: submission });
}
