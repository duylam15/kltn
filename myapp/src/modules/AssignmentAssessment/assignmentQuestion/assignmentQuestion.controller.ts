import { Request, Response } from "express";
import * as service from "./assignmentQuestion.service";

export async function add(req: Request, res: Response) {
    const { assignmentId, questionId } = (req as any).validated.params;
    const data = await service.addQuestionToAssignment(
        assignmentId,
        questionId
    );
    res.json({ success: true, data });
}

export async function remove(req: Request, res: Response) {
    const { assignmentId, questionId } = (req as any).validated.params;
    await service.removeQuestionFromAssignment(assignmentId, questionId);
    res.json({ success: true });
}

export async function getByAssignment(req: Request, res: Response) {
    const { assignmentId } = (req as any).validated.params;
    const data = await service.getQuestionsByAssignment(assignmentId);
    res.json({ success: true, data });
}

export async function getByQuestion(req: Request, res: Response) {
    const { questionId } = (req as any).validated.params;
    const data = await service.getAssignmentsByQuestion(questionId);
    res.json({ success: true, data });
}
