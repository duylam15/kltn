import { Request, Response } from "express";
import * as service from "./assignment.service";
import { prisma } from "@/prisma/client";
import { jsonSafe } from "@/utils/bigint";
export async function getAssignmentsByTeacher(req: Request, res: Response) {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const assignments = await prisma.assignment.findMany({
            where: { createdBy: teacherId },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: jsonSafe(assignments) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// assignment.controller.ts
export async function bySection(req: Request, res: Response) {
  const { sectionId } = req.params;
  if (!sectionId) {
    return res
      .status(400)
      .json({ success: false, message: "sectionId required" });
  }
  const data = await service.getAssignmentsBySection(Number(sectionId));
  res.json({ success: true, data });
}

export async function getAssignmentsBySectionForStudent(
    req: Request,
    res: Response
) {
    try {
        const { sectionId, studentId } = req.params;
        const { type, status } = req.query;

        if (!sectionId || !studentId) {
            return res.status(400).json({
                success: false,
                message: "sectionId và studentId là bắt buộc",
            });
        }

        const filters = {
            type: type as any,
            status: (status as any) || "all",
        };

        const assignments = await service.getAssignmentsBySectionForStudent(
            Number(sectionId),
            Number(studentId),
            filters
        );

        res.json({
            success: true,
            data: jsonSafe(assignments),
            total: assignments.length,
        });
    } catch (error: any) {
        console.error("Error getting assignments for student:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy danh sách bài tập",
        });
    }
}


export async function create(req: Request, res: Response) {
    const { body } = (req as any).validated;
    const assignment = await service.createAssignment(body);
    res.json({ success: true, data: assignment });
}

export async function update(req: Request, res: Response) {
    const { params, body } = (req as any).validated;
    const assignment = await service.updateAssignment(Number(params.id), body);
    res.json({ success: true, data: assignment });
}

export async function remove(req: Request, res: Response) {
    const { params } = (req as any).validated;
    await service.deleteAssignment(Number(params.id));
    res.json({ success: true });
}

export async function list(req: Request, res: Response) {
    const { query } = (req as any).validated;
    const data = await service.getAllAssignments(query);
    res.json({ success: true, data });
}

export async function getById(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const assignment = await service.getAssignmentById(Number(params.id));
    res.json({ success: true, data: assignment });
}

export async function submissions(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const subs = await service.getSubmissionsByAssignment(Number(params.id));
    res.json({ success: true, data: subs });
}

// Start assignment
export async function start(req: Request, res: Response) {
    try {
        // Lấy studentId từ body, query, hoặc auth user
        let studentId = req.body?.studentId || req.query?.studentId;

        // Nếu không có, lấy từ user đã đăng nhập
        if (!studentId && (req as any).user?.student?.id) {
            studentId = (req as any).user.student.id;
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "studentId required",
            });
        }

        const assignmentId = req.params.id;

        if (!assignmentId) {
            return res.status(400).json({
                success: false,
                message: "assignmentId required",
            });
        }

        const submission = await service.startAssignment(
            Number(studentId),
            Number(assignmentId)
        );

        res.json({ success: true, data: submission });
    } catch (error: any) {
        console.error("Error starting assignment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi bắt đầu bài tập",
        });
    }
}

export async function submit(req: Request, res: Response) {
    try {
        // Lấy studentId từ body hoặc user đã đăng nhập
        let studentId = req.body?.studentId;

        if (!studentId && (req as any).user?.student?.id) {
            studentId = (req as any).user.student.id;
        }

        const { answers } = req.body || {};

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "studentId required",
            });
        }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "answers array required",
            });
        }

        const assignmentId = req.params.id;

        const submission = await service.submitAssignment(
            Number(studentId),
            Number(assignmentId),
            answers
        );

        res.json({ success: true, data: submission });
    } catch (error: any) {
        console.error("Error submitting assignment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi nộp bài",
        });
    }
}