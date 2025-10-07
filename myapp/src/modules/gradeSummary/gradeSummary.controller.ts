import { Request, Response } from "express";
import * as service from "./gradeSummary.service";

// Lấy tổng kết điểm của một sinh viên
export const getByStudentAndSection = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const sectionId = Number(req.params.sectionId);
        const summary = await service.getSummary(studentId, sectionId);
        res.json({ success: true, data: summary });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy tổng kết của cả lớp
export const getBySectionWithRanking = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.sectionId);
        const summaries = await service.getSectionSummaries(sectionId);
        res.json({ success: true, data: summaries });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Tính lại điểm tổng kết cho một sinh viên
export const recalculateForStudent = async (req: Request, res: Response) => {
    try {
        const studentId = Number(req.params.studentId);
        const sectionId = Number(req.params.sectionId);
        const summary = await service.calculateSummary(studentId, sectionId);
        res.json({ success: true, data: summary });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Tính lại cho cả lớp
export const recalculateForSection = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.sectionId);
        const result = await service.recalculateAllSummaries(sectionId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Thống kê phân bố điểm
export const getStatistics = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.sectionId);
        const stats = await service.getSectionStatistics(sectionId);
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
