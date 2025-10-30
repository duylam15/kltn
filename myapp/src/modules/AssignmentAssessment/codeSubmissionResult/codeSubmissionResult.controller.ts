import { Request, Response } from "express";
import * as service from "./codeSubmissionResult.service";

export async function getBySubmission(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const results = await service.getCodeResultsBySubmission(
        Number(params.submissionId)
    );
    res.json({ success: true, data: results });
}
