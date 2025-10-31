import { Request, Response, NextFunction } from "express";
import * as sectionEnrollmentService from "./sectionEnrollment.service";
import { prisma } from "../../prisma/client";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";
import ApiError from "@/utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const sectionEnrollment =
        await sectionEnrollmentService.createSectionEnrollment(req.body);
    sendResponse(
        res,
        {
            success: true,
            message: "Student enrolled in section",
            data: sectionEnrollment,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, student_id, status } = req.query as any;

    const result = await sectionEnrollmentService.listSectionEnrollments({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        studentId: student_id ? Number(student_id) : undefined,
        status,
    });

    sendResponse(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const sectionEnrollment =
            await sectionEnrollmentService.getSectionEnrollment(id);
        if (!sectionEnrollment)
            return next(new ApiError(404, "Section enrollment not found"));
        sendResponse(res, { success: true, data: sectionEnrollment });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await sectionEnrollmentService.getSectionEnrollment(id);
        if (!exist)
            return next(new ApiError(404, "Section enrollment not found"));

        const updated = await sectionEnrollmentService.updateSectionEnrollment(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Section enrollment updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await sectionEnrollmentService.getSectionEnrollment(id);
        if (!exist)
            return next(new ApiError(404, "Section enrollment not found"));
        await sectionEnrollmentService.deleteSectionEnrollment(id);
        sendResponse(res, {
            success: true,
            message: "Section enrollment deleted",
        });
    }
);

export const getCoursesByStudent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const studentId = Number(req.params.studentId);
        if (!studentId) return next(new ApiError(400, "studentId is required"));

        const courses = await sectionEnrollmentService.getCoursesByStudent(
            studentId
        );

        sendResponse(res, {
            success: true,
            data: courses,
        });
    }
);

export const getStudentsBySection = catchAsync(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (!sectionId) return next(new ApiError(400, "sectionId required"));

    const data = await sectionEnrollmentService.getStudentsBySection(sectionId);
    sendResponse(res, { success: true, data });
});

export const getStudentsByGroup = catchAsync(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const groupId = Number(req.params.groupId);
    if (!sectionId || !groupId)
        return next(new ApiError(400, "sectionId & groupId required"));

    const data = await sectionEnrollmentService.getStudentsByGroup(
        sectionId,
        groupId
    );
    sendResponse(res, { success: true, data });
});

export const assignStudentToGroup = catchAsync(async (req, res) => {
    const studentId = Number(req.params.studentId);
    const { groupId } = req.body;

    const updated = await sectionEnrollmentService.updateSectionEnrollment(
        studentId,
        { groupId } as any
    );
    sendResponse(res, {
        success: true,
        message: "Assigned to group",
        data: updated,
    });
});

export const removeStudentFromGroup = catchAsync(async (req, res) => {
    const enrollmentId = Number(req.params.enrollmentId);

    const updated = await sectionEnrollmentService.updateSectionEnrollment(
        enrollmentId,
        { groupId: null } as any
    );
    sendResponse(res, {
        success: true,
        message: "Removed from group",
        data: updated,
    });
});

export const getGroupsWithMembers = catchAsync(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (!sectionId) return next(new ApiError(400, "sectionId required"));

    const data = await sectionEnrollmentService.getGroupsWithMembers(sectionId);
    sendResponse(res, { success: true, data });
});

export const getSectionsByStudent = catchAsync(async (req, res, next) => {
    const studentId = Number(req.params.studentId);
    if (!studentId) return next(new ApiError(400, "studentId required"));

    const data = await sectionEnrollmentService.getSectionsByStudent(studentId);
    sendResponse(res, { success: true, data });
});

// Lấy tất cả lớp mà sinh viên (đang đăng nhập)
export const listCoursesByUserId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) return next(new ApiError(400, "Invalid userId"));

    // 🔸 Tìm student theo userId
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) return next(new ApiError(404, "Student not found for this user"));

    // 🔸 Tìm tất cả lớp mà student đã ghi danh
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: { studentId: student.id },
      orderBy: { enrolledAt: "desc" }, // hoặc createdAt nếu không có enrolledAt
      include: {
        section: {
          include: {
            subject: true,
            term: true,
          },
        },
      },
    });

    sendResponse(res, { success: true, data: enrollments });
  }
);
