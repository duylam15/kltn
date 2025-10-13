import { Request, Response } from "express";
import * as service from "./gradeColumn.service";

// Lấy danh sách cột điểm của section
export async function listColumnsBySection(req: Request, res: Response) {
    try {
        const sectionId = Number(req.params.sectionId);
        const columns = await service.listColumnsBySection(sectionId);

        return res.json({
            success: true,
            data: columns,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Tạo cột điểm mới
export async function createColumn(req: Request, res: Response) {
    try {
        const sectionId = Number(req.params.sectionId);
        const data = (req as any).validated.body;

        const column = await service.createColumn(sectionId, data);

        return res.status(201).json({
            success: true,
            message: "Grade column created successfully",
            data: column,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Cập nhật cột điểm
export async function updateColumn(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const data = (req as any).validated.body;

        const column = await service.updateColumn(id, data);

        return res.json({
            success: true,
            message: "Grade column updated successfully",
            data: column,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Xóa cột điểm
export async function deleteColumn(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        await service.deleteColumn(id);

        return res.json({
            success: true,
            message: "Grade column deleted successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Gán buổi điểm danh cho cột
export async function assignAttendanceSessions(req: Request, res: Response) {
    try {
        const columnId = Number(req.params.id);
        // ✅ unwrap thẳng ra array
        const { sessionIds } = (req as any).validated.body;

        console.log("DEBUG body:", sessionIds); // giờ sẽ log thẳng array

        const result = await service.assignAttendanceSessions(
            columnId,
            sessionIds // truyền đúng array
        );

        return res.json({
            success: true,
            message: "Attendance sessions assigned successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("❌ assignAttendanceSessions error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}



// Gán bài tập cho cột
export async function assignAssignments(req: Request, res: Response) {
    try {
        const columnId = Number(req.params.id);
        const assignmentIds = (req as any).validated.body;

        const result = await service.assignAssignments(columnId, assignmentIds);

        return res.json({
            success: true,
            message: "Assignments assigned successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Tính toán lại điểm tự động
export async function recalculateGrades(req: Request, res: Response) {
    try {
        const columnId = Number(req.params.id);
        const result = await service.recalculateColumnGrades(columnId);

        return res.json({
            success: true,
            message: "Grades recalculated successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
