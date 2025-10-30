import { Request, Response } from "express";
import * as service from "./submissionAnswer.service";

export async function getBySubmission(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const answers = await service.getAnswersBySubmission(
        Number(params.submissionId)
    );
    res.json({ success: true, data: answers });
}
