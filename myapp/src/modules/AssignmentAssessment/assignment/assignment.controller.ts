import { Request, Response } from "express";
import * as service from "./assignment.service";
import { prisma } from "../../../prisma/client";
import { jsonSafe } from "../../../utils/bigint";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { fi } from "zod/v4/locales";

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

        console.log("=== SUBMIT ASSIGNMENT ===");
        console.log("Student ID:", studentId);
        console.log("Assignment ID:", assignmentId);
        console.log("Answers count:", answers.length);

        const result = await service.submitAssignment(
            Number(studentId),
            Number(assignmentId),
            answers
        );

        // Trả về kết quả chi tiết bao gồm điểm số
        res.json({
            success: true,
            message: result.submission.autoGraded
                ? "Nộp bài và chấm điểm thành công!"
                : "Nộp bài thành công! Một số câu cần chấm thủ công.",
            data: result,
        });
    } catch (error: any) {
        console.error("Error submitting assignment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi nộp bài",
        });
    }
}

export async function submitCode(req: Request, res: Response) {
    try {
        const assignmentId = Number(req.params.id);
        const { studentId, questionId, codeAnswer, language } = req.body;

        if (!studentId || !questionId || !codeAnswer || !language) {
            return res
                .status(400)
                .json({ success: false, message: "Missing required fields" });
        }

        const answer = await service.submitCodeAnswer({
            studentId,
            assignmentId,
            questionId,
            codeAnswer,
            language,
        });

        res.json({ success: true, data: answer });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}



export async function submitProject(req: Request, res: Response) {
    try {
        const assignmentId = Number(req.params.id);
        const { studentId, questionId } = req.body;

        if (!studentId || !questionId) {
            return res
                .status(400)
                .json({ success: false, message: "Missing required fields" });
        }

        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No file uploaded" });
        }

        const answer = await service.submitProjectAnswer({
            studentId,
            assignmentId,
            questionId,
            filePath: req.file.path,
        });

        res.json({ success: true, data: answer });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function getAnswerStatus(req: Request, res: Response) {
    try {
        const answerId = Number(req.params.answerId);
        const answer = await service.getAnswerStatus(answerId);
        res.json({ success: true, data: answer });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function getAnswerResult(req: Request, res: Response) {
    try {
        const answerId = Number(req.params.answerId);

        const answer = await prisma.submissionAnswer.findUnique({
            where: { id: answerId },
        });

        if (!answer) {
            return res.status(404).json({
                success: false,
                message: "Answer not found",
            });
        }

        res.json({
            success: true,
            data: {
                id: answer.id,
                questionId: answer.questionId,
                score: answer.score,
                maxScore: answer.maxScore,
                judgeStatus: answer.judgeStatus,
                compileLog: answer.compileLog,
                stdoutLog: answer.stdoutLog,
                stderrLog: answer.stderrLog,
                testResults: Array.isArray(answer.testResults) 
                    ? answer.testResults.map((t: any) => ({
                        id: t.id,
                        input: t.input,
                        expect: t.expectedOutput,
                        got: t.actualOutput,
                        status: t.isPassed ? "ok" : "wrong",
                    })) 
                    : [],
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

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

export async function recommendPath(req: Request, res: Response) {
    try {
        const assignmentId = Number(req.params.id);
        const { studentId, score } = req.body;

        if (!studentId || typeof score !== "number") {
            return res.status(400).json({
                success: false,
                message: "Thiếu studentId hoặc score không hợp lệ",
            });
        }

        // Lấy các field khác từ DB
        const [submissions, attendances, grades] = await Promise.all([
            prisma.submission.findMany({
                where: { assignmentId, studentId },
                orderBy: { submittedAt: "desc" },
            }),
            prisma.attendance.findMany({
                where: { studentId },
            }),
            prisma.studentGrade.findMany({
                where: { studentId },
            }),
        ]);

        // Tính toán các giá trị
        const completionTime =
            submissions.length > 0
                ? Math.floor(
                      (submissions[0].completedAt?.getTime() ?? Date.now()) -
                          (submissions[0].startedAt?.getTime() ?? Date.now())
                  ) /
                  1000 /
                  60 // phút
                : null;

        const attemptCount = submissions.length;

        const avgScore =
            submissions.length > 0
                ? submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
                  submissions.length
                : null;

        const attendanceRate =
            attendances.length > 0
                ? attendances.filter((a) => a.status === "present").length /
                  attendances.length
                : null;

        const activityCount = grades.length;

        // Gọi AI service với dữ liệu đầy đủ
        const aiRes = await axios.post("http://localhost:8000/predict", {
            score: score ?? 0,
            completionTime: completionTime ?? 0,
            attemptCount: attemptCount ?? 0,
            avgScore: avgScore ?? 0,
            attendanceRate: attendanceRate ?? 0,
            activityCount: activityCount ?? 0,
        });

        return res.json({
            success: true,
            assignmentId,
            studentId,
            ...aiRes.data, // label + suggestions
        });
    } catch (error: any) {
        console.error(
            "Error calling AI service:",
            error.response?.data || error.message
        );
        return res.status(500).json({
            success: false,
            message: "Không thể gợi ý lộ trình học tập",
        });
    }
}


export async function clusterStudents(req: Request, res: Response) {
    try {
        // Ở đây mình giả định bạn đã có file CSV chứa dữ liệu sinh viên
        // Ví dụ: ./uploads/student_features.csv
        const filePath = "./src/uploads/student_features.csv";
        
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const aiRes = await axios.post(
            "http://localhost:8000/cluster",
            formData,
            {
                headers: formData.getHeaders(),
            }
        );

        console.log(filePath);

        return res.json({
            success: true,
            data: aiRes.data, // [{studentId: 101, avgScore:..., label:"Top"}, ...]
        });
    } catch (error: any) {
        console.error("Error calling AI clustering service:", error.message);
        return res.status(500).json({
            success: false,
            message: "Không thể phân nhóm sinh viên",
        });
    }
}