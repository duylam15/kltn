import { Request, Response } from "express";
import * as service from "./assignment.service";
import { jsonSafe } from "../../utils/bigint";
import { prisma } from "../../prisma/client";

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

// Lấy danh sách bài tập của 1 student
export async function myAssignments(req: Request, res: Response) {
  const { studentId } = req.query; // GET /me/my-assignments?studentId=123
  if (!studentId) {
    return res.status(400).json({ success: false, message: "studentId required" });
  }
  const data = await service.getMyAssignments(Number(studentId));
  res.json({ success: true, data });
}

// Start assignment
export async function start(req: Request, res: Response) {
  const { studentId } = req.body; // POST /assignments/:id/start { studentId: 123 }
  if (!studentId) {
    return res.status(400).json({ success: false, message: "studentId required" });
  }
  const submission = await service.startAssignment(
    Number(studentId),
    Number(req.params.id)
  );
  res.json({ success: true, data: submission });
}

// Submit assignment
export async function submit(req: Request, res: Response) {
  const { studentId, answers } = req.body; // POST /assignments/:id/submit { studentId, answers: [...] }
  if (!studentId) {
    return res.status(400).json({ success: false, message: "studentId required" });
  }
  const submission = await service.submitAssignment(
    Number(studentId),
    Number(req.params.id),
    answers
  );
  res.json({ success: true, data: submission });
}

