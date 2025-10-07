import { Request, Response } from "express";
import * as service from "./grade.service";

// Lấy bảng điểm của section
export async function getGradesBySection(req: Request, res: Response) {
    try {
        const sectionId = Number(req.params.sectionId);
        const grades = await service.getGradesBySection(sectionId);

        return res.json({
            success: true,
            data: grades,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Lấy điểm của 1 sinh viên trong section
export async function getGradesByStudent(req: Request, res: Response) {
    try {
        const sectionId = Number(req.params.sectionId);
        const studentId = Number(req.params.studentId);

        const grades = await service.getGradesByStudent(sectionId, studentId);

        return res.json({
            success: true,
            data: grades,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Cập nhật điểm thủ công
export async function updateGrade(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        const { columnId, studentId, score, note, isExcused } = (req as any)
            .validated.body;

        const grade = await service.updateGrade(
            columnId,
            studentId,
            {
                score,
                note,
                isExcused,
            },
            userId
        );

        return res.json({
            success: true,
            message: "Grade updated successfully",
            data: grade,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Cập nhật nhiều điểm cùng lúc
export async function bulkUpdateGrades(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        const { grades } = (req as any).validated.body;

        const results = await service.bulkUpdateGrades(grades, userId);

        return res.json({
            success: true,
            message: `${results.length} grades updated successfully`,
            data: results,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Export bảng điểm
export async function exportGrades(req: Request, res: Response) {
    try {
        const sectionId = Number(req.params.sectionId);
        const format = (req.query.format as string) || "json";

        const data = await service.exportGrades(sectionId, format);

        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=grades-${sectionId}.csv`
            );
            return res.send(data);
        }

        return res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
