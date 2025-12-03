import { Request, Response, NextFunction } from "express";
import * as studentGradeService from "./student-grade.service";
import catchAsync from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/response";
import ApiError from "../../../utils/ApiError";

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const {
        section_id,
        grade_column_id,
        student_id,
        is_overridden,
        export: shouldExport,
    } = req.query as any;

    // Nếu có flag export
    if (shouldExport === "true") {
        const exportData = await studentGradeService.exportStudentGrades({
            section_id: Number(section_id),
            grade_column_id: grade_column_id
                ? Number(grade_column_id)
                : undefined,
        });

        return sendResponse(res, {
            success: true,
            message: "Export data ready",
            data: exportData,
        });
    }

    const result = await studentGradeService.listStudentGrades({
        section_id: Number(section_id),
        grade_column_id: grade_column_id ? Number(grade_column_id) : undefined,
        student_id: student_id ? Number(student_id) : undefined,
        is_overridden:
            is_overridden === "true"
                ? true
                : is_overridden === "false"
                ? false
                : undefined,
        page,
        limit,
    });

    sendResponse(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { student_id, grade_column_id } = req.query as any;

        if (!student_id || !grade_column_id) {
            return next(
                new ApiError(400, "student_id and grade_column_id are required")
            );
        }

        const grade = await studentGradeService.getStudentGrade({
            student_id: Number(student_id),
            grade_column_id: Number(grade_column_id),
        });

        if (!grade) return next(new ApiError(404, "Student grade not found"));
        sendResponse(res, { success: true, data: grade });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        // ✅ Lấy userId nếu có, không có thì null
        const userId = (req as any).user?.id || null;

        const data = {
            student_id: Number(req.body.student_id),
            grade_column_id: Number(req.body.grade_column_id),
            score:
                req.body.score !== undefined
                    ? Number(req.body.score)
                    : undefined,
            override_score:
                req.body.override_score !== undefined
                    ? Number(req.body.override_score)
                    : undefined,
            override_reason: req.body.override_reason,
            note: req.body.note,
        };

        const grade = await studentGradeService.updateStudentGrade(
            data,
            userId
        );

        sendResponse(res, {
            success: true,
            message: "Grade updated successfully",
            data: grade,
        });
    }
);

// student-grade.controller.ts

export const getSectionGradebook = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const includeUnpublished = req.query.includeUnpublished === "true";

        if (!sectionId || isNaN(sectionId)) {
            return next(new ApiError(400, "Invalid section_id"));
        }

        const gradebook = await studentGradeService.getSectionGradebook({
            section_id: sectionId,
            include_unpublished: includeUnpublished,
        });

        sendResponse(res, { 
            success: true, 
            data: gradebook 
        });
    }
);

// ✅ SỬA: Bulk update - Không bắt buộc user
export const bulkUpdate = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        // ✅ Lấy userId nếu có, không có thì null
        const userId = (req as any).user?.id || null;

        const data = {
            grade_column_id: Number(req.body.grade_column_id),
            grades: req.body.grades,
            override_reason: req.body.override_reason,
        };

        const result = await studentGradeService.bulkUpdateStudentGrades(
            data,
            userId
        );

        sendResponse(res, {
            success: true,
            message: "Grades updated successfully",
            data: result,
        });
    }
);


export const report = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { student_id, section_id, term_id } = req.query as any;

        if (!student_id) {
            return next(new ApiError(400, "student_id is required"));
        }

        const report = await studentGradeService.getStudentGradeReport({
            student_id: Number(student_id),
            section_id: section_id ? Number(section_id) : undefined,
            term_id: term_id ? Number(term_id) : undefined,
        });

        sendResponse(res, { success: true, data: report });
    }
);
