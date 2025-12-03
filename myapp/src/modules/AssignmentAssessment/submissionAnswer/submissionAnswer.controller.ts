import { Request, Response } from "express";
import * as service from "./submissionAnswer.service";

export async function getBySubmission(req: Request, res: Response) {
    try {
        const { params } = (req as any).validated;
        const results = await service.getResultsBySubmission(
            Number(params.submissionId)
        );
        res.json({ success: true, data: results });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy kết quả code",
        });
    }
}

export async function getById(req: Request, res: Response) {
    try {
        const { params } = (req as any).validated;
        const result = await service.getResultById(Number(params.id));

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy kết quả",
            });
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy kết quả code",
        });
    }
}

export async function update(req: Request, res: Response) {
    try {
        const { params, body } = (req as any).validated;
        const id = Number(params.id);

        const updated = await service.updateSubmissionAnswer(id, {
            essayAnswer: body.essayAnswer,
            codeAnswer: body.codeAnswer,
            language: body.language,
            filePath: body.filePath,
            isFolder: body.isFolder,
            selectedChoices: body.selectedChoices,

            score: body.score !== undefined ? Number(body.score) : undefined,
            maxScore:
                body.maxScore !== undefined ? Number(body.maxScore) : undefined,

            judgeStatus: body.judgeStatus,
            compileLog: body.compileLog,
            stdoutLog: body.stdoutLog,
            stderrLog: body.stderrLog,

            testResults: body.testResults,
        });

        return res.json({
            success: true,
            message: "Đã cập nhật câu trả lời.",
            data: updated,
        });
    } catch (error: any) {
        console.error("❌ Error updating submission answer:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi cập nhật câu trả lời",
        });
    }
}
