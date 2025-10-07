import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as courseSectionService from "./courseSection.service";
import { prisma } from "../../prisma/client";

export const create = catchAsync(async (req: Request, res: Response) => {
    const courseSection = await courseSectionService.createCourseSection(
        req.body
    );
    sendResponse(
        res,
        {
            success: true,
            message: "Course section created",
            data: courseSection,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { status, subject_id, term_id, q } = req.query as any;

    const result = await courseSectionService.listCourseSections({
        status,
        subjectId: subject_id ? Number(subject_id) : undefined,
        termId: term_id ? Number(term_id) : undefined,
        q,
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
        const courseSection = await courseSectionService.getCourseSection(id);
        if (!courseSection)
            return next(new ApiError(404, "Course section not found"));
        sendResponse(res, { success: true, data: courseSection });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await courseSectionService.getCourseSection(id);
        if (!exist) return next(new ApiError(404, "Course section not found"));

        const updated = await courseSectionService.updateCourseSection(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Course section updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await courseSectionService.getCourseSection(id);
        if (!exist) return next(new ApiError(404, "Course section not found"));
        await courseSectionService.deleteCourseSection(id);
        sendResponse(res, { success: true, message: "Course section deleted" });
    }
);


declare global {
  namespace Express {
    interface Request { user?: { id: number; [k: string]: any } }
  }
}

// helper: get student by user id
async function getStudentByUserIdOrThrow(userId: number) {
  const st = await prisma.student.findUnique({ where: { userId } });
  if (!st) throw new ApiError(404, "Student profile not found");
  return st;
}


export const joinByCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const code = String(req.body.code || "").trim();
  if (!code) return next(new ApiError(400, "Class code is required"));

  // tìm lớp theo code
  const section = await prisma.courseSection.findFirst({
    where: { sectionCode: code },
  });
  if (!section) return next(new ApiError(404, "Invalid class code"));

  // xác định student hiện tại (từ user đăng nhập)
  const userId = req.user?.id;
  if (!userId) return next(new ApiError(401, "Unauthorized"));
  const student = await getStudentByUserIdOrThrow(userId);

  // kiểm tra đã ghi danh chưa
  const exist = await prisma.sectionEnrollment.findFirst({
    where: { sectionId: section.id, studentId: student.id },
  });
  if (exist) {
    return sendResponse(res, {
      success: true,
      message: "You are already enrolled in this class",
      data: { sectionId: section.id, enrollmentId: exist.id },
    });
  }

  // tạo enrollment
  const enrollment = await prisma.sectionEnrollment.create({
    data: {
      sectionId: section.id,
      studentId: student.id,
      // status: "active" // nếu bạn có field
    },
  });

  sendResponse(res, {
    success: true,
    message: "Joined class successfully",
    data: { sectionId: section.id, enrollmentId: enrollment.id },
  });
});




