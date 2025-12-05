"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestSubmissions = getBestSubmissions;
exports.submit = submit;
exports.submitCode = submitCode;
exports.submitProject = submitProject;
exports.getAnswerStatus = getAnswerStatus;
exports.getAnswerResult = getAnswerResult;
exports.getAssignmentsByTeacher = getAssignmentsByTeacher;
exports.bySection = bySection;
exports.getAssignmentsBySectionForStudent = getAssignmentsBySectionForStudent;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.list = list;
exports.getById = getById;
exports.submissions = submissions;
exports.start = start;
exports.recommendPath = recommendPath;
exports.clusterStudents = clusterStudents;
const service = __importStar(require("./assignment.service"));
const client_1 = require("../../../prisma/client");
const bigint_1 = require("../../../utils/bigint");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
async function getBestSubmissions(req, res) {
    try {
        const assignmentId = Number(req.params.id);
        const sectionId = req.query.sectionId
            ? Number(req.query.sectionId)
            : undefined;
        if (!assignmentId || isNaN(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "assignmentId không hợp lệ",
            });
        }
        const result = await service.getAssignmentWithBestSubmissions(assignmentId, sectionId);
        res.json({
            success: true,
            data: (0, bigint_1.jsonSafe)(result),
        });
    }
    catch (error) {
        console.error("Error getting best submissions:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy điểm cao nhất",
        });
    }
}
async function submit(req, res) {
    try {
        // Lấy studentId từ body hoặc user đã đăng nhập
        let studentId = req.body?.studentId;
        if (!studentId && req.user?.student?.id) {
            studentId = req.user.student.id;
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
        const result = await service.submitAssignment(Number(studentId), Number(assignmentId), answers);
        // Trả về kết quả chi tiết bao gồm điểm số
        res.json({
            success: true,
            message: result.submission.autoGraded
                ? "Nộp bài và chấm điểm thành công!"
                : "Nộp bài thành công! Một số câu cần chấm thủ công.",
            data: result,
        });
    }
    catch (error) {
        console.error("Error submitting assignment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi nộp bài",
        });
    }
}
async function submitCode(req, res) {
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function submitProject(req, res) {
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function getAnswerStatus(req, res) {
    try {
        const answerId = Number(req.params.answerId);
        const answer = await service.getAnswerStatus(answerId);
        res.json({ success: true, data: answer });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function getAnswerResult(req, res) {
    try {
        const answerId = Number(req.params.answerId);
        const answer = await client_1.prisma.submissionAnswer.findUnique({
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
                    ? answer.testResults.map((t) => ({
                        id: t.id,
                        input: t.input,
                        expect: t.expectedOutput,
                        got: t.actualOutput,
                        status: t.isPassed ? "ok" : "wrong",
                    }))
                    : [],
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function getAssignmentsByTeacher(req, res) {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const assignments = await client_1.prisma.assignment.findMany({
            where: { createdBy: teacherId },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data: (0, bigint_1.jsonSafe)(assignments) });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
// assignment.controller.ts
async function bySection(req, res) {
    const { sectionId } = req.params;
    if (!sectionId) {
        return res
            .status(400)
            .json({ success: false, message: "sectionId required" });
    }
    const data = await service.getAssignmentsBySection(Number(sectionId));
    res.json({ success: true, data });
}
async function getAssignmentsBySectionForStudent(req, res) {
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
            type: type,
            status: status || "all",
        };
        const assignments = await service.getAssignmentsBySectionForStudent(Number(sectionId), Number(studentId), filters);
        res.json({
            success: true,
            data: (0, bigint_1.jsonSafe)(assignments),
            total: assignments.length,
        });
    }
    catch (error) {
        console.error("Error getting assignments for student:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy danh sách bài tập",
        });
    }
}
async function create(req, res) {
    const { body } = req.validated;
    const assignment = await service.createAssignment(body);
    res.json({ success: true, data: assignment });
}
async function update(req, res) {
    const { params, body } = req.validated;
    const assignment = await service.updateAssignment(Number(params.id), body);
    res.json({ success: true, data: assignment });
}
async function remove(req, res) {
    const { params } = req.validated;
    await service.deleteAssignment(Number(params.id));
    res.json({ success: true });
}
async function list(req, res) {
    const { query } = req.validated;
    const data = await service.getAllAssignments(query);
    res.json({ success: true, data });
}
async function getById(req, res) {
    const { params } = req.validated;
    const assignment = await service.getAssignmentById(Number(params.id));
    res.json({ success: true, data: assignment });
}
async function submissions(req, res) {
    const { params } = req.validated;
    const subs = await service.getSubmissionsByAssignment(Number(params.id));
    res.json({ success: true, data: subs });
}
// Start assignment
async function start(req, res) {
    try {
        // Lấy studentId từ body, query, hoặc auth user
        let studentId = req.body?.studentId || req.query?.studentId;
        // Nếu không có, lấy từ user đã đăng nhập
        if (!studentId && req.user?.student?.id) {
            studentId = req.user.student.id;
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
        const submission = await service.startAssignment(Number(studentId), Number(assignmentId));
        res.json({ success: true, data: submission });
    }
    catch (error) {
        console.error("Error starting assignment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi bắt đầu bài tập",
        });
    }
}
async function recommendPath(req, res) {
    try {
        const assignmentId = Number(req.params.id);
        const { studentId, score, sectionId } = req.body;
        if (!studentId || typeof score !== "number") {
            return res.status(400).json({
                success: false,
                message: "Thiếu studentId hoặc score không hợp lệ",
            });
        }
        // ✅ Kiểm tra sectionId
        if (!sectionId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu sectionId",
            });
        }
        // === 1. Lấy assignment hiện tại để biết môn + chương ===
        const currentAssignment = await client_1.prisma.assignment.findUnique({
            where: { id: assignmentId },
            select: {
                subjectId: true,
                chapterId: true,
            },
        });
        if (!currentAssignment) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài tập",
            });
        }
        // === 2. Lấy các field khác từ DB ===
        const [submissions, attendances, grades] = await Promise.all([
            client_1.prisma.submission.findMany({
                where: { assignmentId, studentId },
                orderBy: { submittedAt: "desc" },
            }),
            client_1.prisma.attendance.findMany({ where: { studentId } }),
            client_1.prisma.studentGrade.findMany({ where: { studentId } }),
        ]);
        // === 3.  Tính toán ===
        const completionTime = submissions.length > 0
            ? Math.floor((submissions[0].completedAt?.getTime() ?? Date.now()) -
                (submissions[0].startedAt?.getTime() ?? Date.now())) /
                1000 /
                60
            : 0;
        const attemptCount = submissions.length;
        const avgScore = submissions.length > 0
            ? submissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
                submissions.length
            : 0;
        const attendanceRate = attendances.length > 0
            ? attendances.filter((a) => a.status === "present").length /
                attendances.length
            : 0;
        const activityCount = grades.length;
        const aiPayload = {
            score,
            completionTime,
            attemptCount,
            avgScore,
            attendanceRate,
            activityCount,
        };
        // === 4.  Gọi AI ===
        const aiRes = await axios_1.default.post("http://localhost:8000/predict", aiPayload);
        const label = aiRes.data?.label || "NORMAL";
        // === 5. Lấy các bài tập có độ khó tương tự + cùng môn + cùng chương + ĐÃ MỞ CHO SECTION ===
        const relatedAssignments = await client_1.prisma.assignment.findMany({
            where: {
                id: { not: assignmentId },
                subjectId: currentAssignment.subjectId,
                chapterId: currentAssignment.chapterId,
                difficulty: label,
                sectionLinks: {
                    some: {
                        sectionId: sectionId,
                        isOpen: true,
                    },
                },
            },
            select: {
                id: true,
                title: true,
                difficulty: true,
                maxScore: true,
                dueDate: true,
                description: true,
            },
        });
        // === 6. Lấy tài liệu cùng môn + cùng chương + đã gán vào lớp + đang mở ===
        const relatedMaterialsRaw = await client_1.prisma.material.findMany({
            where: {
                subjectId: currentAssignment.subjectId,
                chapterId: currentAssignment.chapterId,
                courseLinks: {
                    some: {
                        courseSectionId: sectionId,
                        isOpen: true,
                    },
                },
            },
            select: {
                id: true,
                title: true,
                description: true,
                fileName: true,
                filePath: true,
                fileType: true,
                fileSize: true, // ⚠️ BigInt - cần chuyển đổi
                category: true,
                link: true,
                uploadedAt: true,
                uploader: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
            orderBy: {
                uploadedAt: "desc",
            },
        });
        // ✅ Convert BigInt sang Number hoặc String
        const relatedMaterials = relatedMaterialsRaw.map((material) => ({
            ...material,
            fileSize: material.fileSize ? Number(material.fileSize) : null, // hoặc String(material.fileSize)
        }));
        // === 7.  Trả về ===
        return res.json({
            success: true,
            assignmentId,
            studentId,
            sectionId,
            assignment: currentAssignment,
            metrics: aiPayload,
            label,
            suggestions: aiRes.data?.suggestions ?? [],
            relatedAssignments,
            relatedMaterials,
        });
    }
    catch (error) {
        console.error("Error calling AI service:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Không thể gợi ý lộ trình học tập",
            error: error.message, // ✅ Thêm detail để debug
        });
    }
}
async function clusterStudents(req, res) {
    try {
        // Ở đây mình giả định bạn đã có file CSV chứa dữ liệu sinh viên
        // Ví dụ: ./uploads/student_features.csv
        const filePath = "./src/uploads/student_features.csv";
        const formData = new form_data_1.default();
        formData.append("file", fs_1.default.createReadStream(filePath));
        const aiRes = await axios_1.default.post("http://localhost:8000/cluster", formData, {
            headers: formData.getHeaders(),
        });
        console.log(filePath);
        return res.json({
            success: true,
            data: aiRes.data, // [{studentId: 101, avgScore:..., label:"Top"}, ...]
        });
    }
    catch (error) {
        console.error("Error calling AI clustering service:", error.message);
        return res.status(500).json({
            success: false,
            message: "Không thể phân nhóm sinh viên",
        });
    }
}
