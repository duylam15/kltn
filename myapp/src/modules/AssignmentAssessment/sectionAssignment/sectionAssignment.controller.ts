import { Request, Response } from "express";
import * as service from "./sectionAssignment.service";
import { io } from "../../../server";

export async function toggleVisibility(req: Request, res: Response) {
    try {
        const { sectionId, assignmentId } = req.params;
        const { isOpen } = req.body;

        const updated = await service.updateAssignmentVisibility(
            Number(sectionId),
            Number(assignmentId),
            Boolean(isOpen)
        );

        return res.json({
            success: true,
            message: `Assignment visibility updated`,
            data: updated,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export async function assignToSection(req: Request, res: Response) {
    const sectionId = Number(req.params.id);
    const { assignmentId } = (req as any).validated.body;

    try {
        const { sectionAssignment, studentsNotified } =
            await service.assignToSection(sectionId, assignmentId);

        // 🔥 Phát thông báo realtime cho toàn bộ lớp
        io.to(`section_${sectionId}`).emit("newAssignment", {
            assignment: sectionAssignment.assignment,
            section: {
                id: sectionAssignment.section.id,
                sectionCode: sectionAssignment.section.sectionCode,
                sectionName: sectionAssignment.section.sectionName,
                subject: sectionAssignment.section.subject,
            },
            message: `Bài tập mới: ${sectionAssignment.assignment.title}`,
            timestamp: new Date(),
        });

        // 🔥 Phát notification riêng cho từng sinh viên
        studentsNotified.forEach((student: any) => {
            io.to(`user_${student.userId}`).emit("newNotification", {
                type: "assignment",
                title: `Bài tập mới: ${sectionAssignment.assignment.title}`,
                message: `Bạn có bài tập mới trong lớp ${sectionAssignment.section.subject.subjectName}`,
                assignmentId: sectionAssignment.assignment.id,
                sectionId: sectionId,
                createdAt: new Date(),
            });
        });

        res.json({
            success: true,
            data: sectionAssignment,
            studentsNotified: studentsNotified.length,
        });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function unassignFromSection(req: Request, res: Response) {
    const sectionId = Number(req.params.id);
    const assignmentId = Number(req.params.assignmentId);
    try {
        await service.unassignFromSection(sectionId, assignmentId);
        res.json({ success: true });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function listBySection(req: Request, res: Response) {
    const sectionId = Number(req.params.id);
    try {
        const data = await service.listBySection(sectionId);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function listByAssignment(req: Request, res: Response) {
    const assignmentId = Number(req.params.id);
    try {
        const data = await service.listByAssignment(assignmentId);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}
