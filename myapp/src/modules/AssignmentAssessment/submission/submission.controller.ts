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

export async function selectFinalSubmission(req: Request, res: Response) {
    const { params } = (req as any).validated;

    const submissionId = Number(params.id);

    const updated = await service.setFinalSubmission(submissionId);

    return res.json({
        success: true,
        message: "Đã chọn lần nộp này làm điểm chính thức.",
        data: updated,
    });
}

// 🔥 HÀM CẬP NHẬT ĐIỂM SUBMISSION
export async function updateScore(req: Request, res: Response) {
    try {
        const { params, body } = (req as any).validated;
        const submissionId = Number(params.id);
        const { score, feedback } = body;

        const updated = await service.updateSubmissionScore(submissionId, {
            score: score !== undefined ? Number(score) : undefined,
            feedback: feedback || undefined,
        });

        return res.json({
            success: true,
            message: "Đã cập nhật điểm submission.",
            data: updated,
        });
    } catch (error: any) {
        console.error("Error updating submission score:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi cập nhật điểm",
        });
    }
}
