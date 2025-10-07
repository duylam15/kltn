import { Request, Response } from "express";
import * as gradeService from "./grade.service";
import { prisma } from "../../prisma/client";

// ========== GRADE COLUMN ==========

// Thêm các cột vào cột tổng hợp
export async function addColumnsToColumn(req: Request, res: Response) {
  try {
    const parentColumnId = parseInt(req.params.columnId);
    const { childColumnIds, weight } = req.body;

    if (!Array.isArray(childColumnIds) || childColumnIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "childColumnIds must be a non-empty array",
      });
    }

    const result = await gradeService.addColumnsToColumn(
      parentColumnId,
      childColumnIds,
      weight
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// Xóa cột khỏi cột tổng hợp
export async function removeColumnFromColumn(req: Request, res: Response) {
  try {
    const parentColumnId = parseInt(req.params.columnId);
    const childColumnId = parseInt(req.params.childColumnId);

    await gradeService.removeColumnFromColumn(parentColumnId, childColumnId);

    res.json({
      success: true,
      message: "Column removed from parent column",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// Lấy danh sách cột trong cột tổng hợp
export async function getColumnsInColumn(req: Request, res: Response) {
  try {
    const parentColumnId = parseInt(req.params.columnId);
    const columns = await gradeService.getColumnsInColumn(parentColumnId);

    res.json({ success: true, data: columns });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
// Tạo cột điểm
// Thêm vào grade.controller.ts
export async function createGradeColumn(req: Request, res: Response) {
    try {
        const { sectionId, type, ...rest } = req.body;

        // Tự động gán displayOrder dựa trên type
        const displayOrderMap: { [key: string]: number } = {
            attendance: 10,
            assignment: 20,
            midterm: 30,
            final: 40,
            project: 50,
            participation: 60,
            custom: 70,
        };

        const existingColumns = await prisma.gradeColumn.findMany({
            where: { sectionId: Number(sectionId), type },
            orderBy: { displayOrder: "desc" },
            take: 1,
        });

        let displayOrder = displayOrderMap[type] || 70;

        if (existingColumns.length > 0) {
            displayOrder = existingColumns[0].displayOrder + 1;
        }

        const gradeColumn = await gradeService.createGradeColumn({
            sectionId: Number(sectionId),
            type,
            displayOrder,
            ...rest,
        });

        console.log(`[createGradeColumn] Created column:`, gradeColumn);

        res.json({ success: true, data: gradeColumn });
    } catch (err: any) {
        console.error("[createGradeColumn] Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function calculateGrades(req: Request, res: Response) {
    try {
        const columnId = parseInt(req.params.columnId);
        const { studentIds } = req.body;

        console.log(
            `[calculateGrades] Calculating for column ${columnId}, students:`,
            studentIds
        );

        const grades = await gradeService.calculateAndSaveStudentGrades(
            columnId,
            studentIds
        );

        console.log(`[calculateGrades] Calculated ${grades.length} grades`);

        res.json({
            success: true,
            data: grades,
            message: `Calculated grades for ${grades.length} students`,
        });
    } catch (err: any) {
        console.error("[calculateGrades] Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy danh sách cột điểm theo section
export async function getGradeColumnsBySection(req: Request, res: Response) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const gradeColumns = await gradeService.getGradeColumnsBySection(
            sectionId
        );

        res.json({ success: true, data: gradeColumns });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy chi tiết cột điểm
export async function getGradeColumn(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const gradeColumn = await gradeService.getGradeColumnById(id);

        if (!gradeColumn) {
            return res.status(404).json({
                success: false,
                message: "Grade column not found",
            });
        }

        res.json({ success: true, data: gradeColumn });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Cập nhật cột điểm
export async function updateGradeColumn(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const {
            name,
            description,
            maxScore,
            weight,
            calculationMethod,
            bestNCount,
            dropLowest,
            isPublished,
            displayOrder,
        } = req.body;

        const gradeColumn = await gradeService.updateGradeColumn(id, {
            name,
            description,
            maxScore,
            weight,
            calculationMethod,
            bestNCount,
            dropLowest,
            isPublished,
            displayOrder,
        });

        res.json({ success: true, data: gradeColumn });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Xóa cột điểm
export async function deleteGradeColumn(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        await gradeService.deleteGradeColumn(id);

        res.json({
            success: true,
            message: "Grade column deleted successfully",
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Publish/Unpublish cột điểm
export async function togglePublishGradeColumn(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const { isPublished } = req.body;

        const gradeColumn = await gradeService.updateGradeColumn(id, {
            isPublished,
        });

        res.json({ success: true, data: gradeColumn });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// ========== GRADE COLUMN - ATTENDANCE SESSION ==========

// Thêm attendance sessions vào cột điểm
export async function addAttendanceSessionsToColumn(
    req: Request,
    res: Response
) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const { sessionIds, weight } = req.body; // sessionIds: number[], weight?: number

        if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "sessionIds must be a non-empty array",
            });
        }

        const result = await gradeService.addAttendanceSessionsToColumn(
            gradeColumnId,
            sessionIds,
            weight
        );

        res.json({ success: true, data: result });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Xóa attendance session khỏi cột điểm
export async function removeAttendanceSessionFromColumn(
    req: Request,
    res: Response
) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const sessionId = parseInt(req.params.sessionId);

        await gradeService.removeAttendanceSessionFromColumn(
            gradeColumnId,
            sessionId
        );

        res.json({
            success: true,
            message: "Attendance session removed from grade column",
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy danh sách attendance sessions trong cột điểm
export async function getAttendanceSessionsInColumn(
    req: Request,
    res: Response
) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const sessions = await gradeService.getAttendanceSessionsInColumn(
            gradeColumnId
        );

        res.json({ success: true, data: sessions });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// ========== GRADE COLUMN - ASSIGNMENT ==========

// Thêm assignments vào cột điểm
export async function addAssignmentsToColumn(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const { assignmentIds, weight } = req.body; // assignmentIds: number[], weight?: number

        if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "assignmentIds must be a non-empty array",
            });
        }

        const result = await gradeService.addAssignmentsToColumn(
            gradeColumnId,
            assignmentIds,
            weight
        );

        res.json({ success: true, data: result });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Xóa assignment khỏi cột điểm
export async function removeAssignmentFromColumn(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const assignmentId = parseInt(req.params.assignmentId);

        await gradeService.removeAssignmentFromColumn(
            gradeColumnId,
            assignmentId
        );

        res.json({
            success: true,
            message: "Assignment removed from grade column",
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy danh sách assignments trong cột điểm
export async function getAssignmentsInColumn(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const assignments = await gradeService.getAssignmentsInColumn(
            gradeColumnId
        );

        res.json({ success: true, data: assignments });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// ========== STUDENT GRADE ==========

// Tính toán điểm cho sinh viên
export async function calculateStudentGrades(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const  studentIds  = req.body; // optional, nếu không có thì tính cho tất cả
console.log(studentIds);    
        const results = await gradeService.calculateAndSaveStudentGrades(
            gradeColumnId,
            studentIds
        );

        res.json({ success: true, data: results });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy điểm của sinh viên theo cột điểm
export async function getStudentGradesByColumn(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const grades = await gradeService.getStudentGradesByColumn(
            gradeColumnId
        );

        res.json({ success: true, data: grades });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy điểm của 1 sinh viên cụ thể
export async function getStudentGrade(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentId = parseInt(req.params.studentId);

        const grade = await gradeService.getStudentGrade(
            gradeColumnId,
            studentId
        );

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: "Student grade not found",
            });
        }

        res.json({ success: true, data: grade });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Ghi đè điểm thủ công
export async function overrideStudentGrade(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentId = parseInt(req.params.studentId);
        const { overriddenScore, note, overriddenBy } = req.body;

        if (overriddenScore === undefined || overriddenScore === null) {
            return res.status(400).json({
                success: false,
                message: "overriddenScore is required",
            });
        }

        const grade = await gradeService.overrideStudentGrade(
            gradeColumnId,
            studentId,
            overriddenScore,
            overriddenBy,
            note
        );

        res.json({ success: true, data: grade });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Xóa ghi đè điểm (trở về điểm tự động)
export async function removeGradeOverride(req: Request, res: Response) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentId = parseInt(req.params.studentId);

        const grade = await gradeService.removeGradeOverride(
            gradeColumnId,
            studentId
        );

        res.json({ success: true, data: grade });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy toàn bộ bảng điểm của section
export async function getSectionGradeBook(req: Request, res: Response) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const includeUnpublished = req.query.includeUnpublished === "true";

        const gradeBook = await gradeService.getSectionGradeBook(
            sectionId,
            includeUnpublished
        );

        res.json({ success: true, data: gradeBook });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Lấy điểm của sinh viên trong section
export async function getStudentGradesInSection(req: Request, res: Response) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const studentId = parseInt(req.params.studentId);

        const grades = await gradeService.getStudentGradesInSection(
            sectionId,
            studentId
        );

        res.json({ success: true, data: grades });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Export điểm ra CSV/Excel
export async function exportGrades(req: Request, res: Response) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const format = req.query.format || "csv"; // csv or excel

        const csv = await gradeService.exportGradesToCSV(sectionId);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=grades-section-${sectionId}.csv`
        );
        res.send(csv);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
