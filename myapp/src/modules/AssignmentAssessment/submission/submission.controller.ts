import { Request, Response } from "express";
import * as service from "./submission.service";

/**
 * 📘 Lấy lịch sử nộp bài của 1 student trong 1 assignment
 */
export async function getHistory(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const submissions = await service.getSubmissionsHistory(
        Number(params.assignmentId),
        Number(params.studentId)
    );
    res.json({ success: true, data: submissions });
}

/**
 * 📘 Lấy chi tiết 1 bài nộp
 */
export async function getById(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const submission = await service.getSubmissionById(Number(params.id));
    res.json({ success: true, data: submission });
}

/**
 * 🏆 Lấy bài nộp có điểm cao nhất của 1 student trong 1 assignment
 */
export async function getBest(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const submission = await service.getBestSubmission(
        Number(params.assignmentId),
        Number(params.studentId)
    );
    res.json({ success: true, data: submission });
}

/**
 * 🆕 Tạo bài nộp mới
 */
export async function create(req: Request, res: Response) {
    const { body } = (req as any).validated;
    const newSubmission = await service.createSubmission(body);
    res.json({ success: true, data: newSubmission });
}

/**
 * ✏️ Cập nhật bài nộp (chấm điểm, feedback, autoGraded...)
 */
export async function update(req: Request, res: Response) {
    const { params, body } = (req as any).validated;
    const updated = await service.updateSubmission(Number(params.id), body);
    res.json({ success: true, data: updated });
}

/**
 * ❌ Xoá bài nộp
 */
export async function remove(req: Request, res: Response) {
    const { params } = (req as any).validated;
    await service.deleteSubmission(Number(params.id));
    res.json({ success: true, message: "Deleted successfully" });
}

/**
 * 🗂️ Lấy tất cả bài nộp (admin xem)
 */
export async function getAll(req: Request, res: Response) {
    const submissions = await service.getAllSubmissions();
    res.json({ success: true, data: submissions });
}
