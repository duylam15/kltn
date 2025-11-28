import { Request, Response, NextFunction } from "express";
import * as subjectInstructorService from "./subjectInstructor.service";
import catchAsync from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/response";
import ApiError from "../../../utils/ApiError";

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                [key: string]: any;
            };
        }
    }
}

export const assign = catchAsync(async (req: Request, res: Response) => {
    const assignment = await subjectInstructorService.assignSubjectToTeacher({
        ...req.body,
        assignedBy: req.user?.id, // Từ auth middleware
    });

    sendResponse(
        res,
        {
            success: true,
            message: "Subject assigned to teacher successfully",
            data: assignment,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const {
        subject_id,
        teacher_id,
        role,
        is_active,
        subject_code,
        department,
    } = req.query as any;

    const result = await subjectInstructorService.listSubjectInstructors({
        page,
        limit,
        subjectId: subject_id ? Number(subject_id) : undefined,
        teacherId: teacher_id ? Number(teacher_id) : undefined,
        role,
        isActive:
            is_active === "true"
                ? true
                : is_active === "false"
                ? false
                : undefined,
        subjectCode: subject_code,
        department,
    });

    sendResponse(res, {
        success: true,
        data: result.items,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const subjectId = Number(req.params.subjectId);
        const teacherId = Number(req.params.teacherId);

        const assignment = await subjectInstructorService.getSubjectInstructor(
            subjectId,
            teacherId
        );

        if (!assignment) {
            return next(new ApiError(404, "Subject assignment not found"));
        }

        sendResponse(res, {
            success: true,
            data: assignment,
        });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const subjectId = Number(req.params.subjectId);
        const teacherId = Number(req.params.teacherId);

        const exist = await subjectInstructorService.getSubjectInstructor(
            subjectId,
            teacherId
        );

        if (!exist) {
            return next(new ApiError(404, "Subject assignment not found"));
        }

        const updated = await subjectInstructorService.updateSubjectInstructor(
            subjectId,
            teacherId,
            req.body
        );

        sendResponse(res, {
            success: true,
            message: "Subject assignment updated successfully",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const subjectId = Number(req.params.subjectId);
        const teacherId = Number(req.params.teacherId);

        const exist = await subjectInstructorService.getSubjectInstructor(
            subjectId,
            teacherId
        );

        if (!exist) {
            return next(new ApiError(404, "Subject assignment not found"));
        }

        await subjectInstructorService.deleteSubjectInstructor(
            subjectId,
            teacherId
        );

        sendResponse(res, {
            success: true,
            message: "Subject assignment removed successfully",
        });
    }
);

export const getTeacherSubjects = catchAsync(
    async (req: Request, res: Response) => {
        const teacherId = Number(req.params.teacherId);

        const subjects = await subjectInstructorService.getTeacherSubjects(
            teacherId
        );

        sendResponse(res, {
            success: true,
            data: subjects,
        });
    }
);

export const bulkAssign = catchAsync(async (req: Request, res: Response) => {
    const result = await subjectInstructorService.bulkAssignSubjects({
        ...req.body,
        assignedBy: req.user?.id,
    });

    sendResponse(
        res,
        {
            success: true,
            message: `Successfully assigned ${result.created} subjects (${result.skipped} already assigned)`,
            data: result,
        },
        201
    );
});


export const bulkAssignTeachers = catchAsync(
    async (req: Request, res: Response) => {
        const result = await subjectInstructorService.bulkAssignTeachers({
            ...req.body,
            assignedBy: req.user?.id,
        });

        sendResponse(
            res,
            {
                success: true,
                message: `Successfully assigned ${result.created} teacher(s) to subject (${result.skipped} already assigned)`,
                data: result,
            },
            201
        );
    }
);

export const getSubjectTeachers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const subjectId = Number(req.params.subjectId);

        const result = await subjectInstructorService.getSubjectTeachers(
            subjectId
        );

        sendResponse(res, {
            success: true,
            data: result,
        });
    }
);

export const removeTeachersFromSubject = catchAsync(
    async (req: Request, res: Response) => {
        const result = await subjectInstructorService.removeTeachersFromSubject(
            req.body
        );

        sendResponse(res, {
            success: true,
            message: `Successfully removed ${result.removed} teacher(s) from subject`,
            data: result,
        });
    }
);