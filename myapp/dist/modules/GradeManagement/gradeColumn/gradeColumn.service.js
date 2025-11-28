"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listColumnsBySection = listColumnsBySection;
exports.createColumn = createColumn;
exports.updateColumn = updateColumn;
exports.deleteColumn = deleteColumn;
exports.assignAttendanceSessions = assignAttendanceSessions;
exports.assignAssignments = assignAssignments;
exports.recalculateColumnGrades = recalculateColumnGrades;
const client_1 = require("../../../prisma/client");
async function listColumnsBySection(sectionId) {
    return client_1.prisma.gradeColumn.findMany({
        where: { sectionId },
        include: {
            attendanceSessions: {
                include: {
                    session: {
                        select: {
                            id: true,
                            sessionCode: true,
                            createdAt: true,
                        },
                    },
                },
            },
            assignments: {
                include: {
                    assignment: {
                        select: {
                            id: true,
                            title: true,
                            maxScore: true,
                            dueDate: true,
                        },
                    },
                },
            },
            _count: {
                select: { studentGrades: true },
            },
        },
        orderBy: { displayOrder: "asc" },
    });
}
async function createColumn(sectionId, data) {
    // Lấy displayOrder cao nhất hiện tại
    const maxOrder = await client_1.prisma.gradeColumn.findFirst({
        where: { sectionId },
        orderBy: { displayOrder: "desc" },
        select: { displayOrder: true },
    });
    return client_1.prisma.gradeColumn.create({
        data: {
            sectionId,
            name: data.name,
            type: data.type,
            weight: data.weight,
            maxScore: data.maxScore ?? 100,
            calculationMethod: data.calculationMethod ?? "average",
            bestNCount: data.bestNCount,
            dropLowest: data.dropLowest ?? 0,
            isPublished: data.isPublished ?? false,
            displayOrder: data.displayOrder ?? (maxOrder?.displayOrder ?? 0) + 1,
            description: data.description,
        },
        include: {
            attendanceSessions: true,
            assignments: true,
        },
    });
}
async function updateColumn(id, data) {
    return client_1.prisma.gradeColumn.update({
        where: { id },
        data,
        include: {
            attendanceSessions: true,
            assignments: true,
        },
    });
}
async function deleteColumn(id) {
    // Check if column has grades
    const column = await client_1.prisma.gradeColumn.findUnique({
        where: { id },
        include: {
            _count: {
                select: { studentGrades: true },
            },
        },
    });
    if (column?._count?.studentGrades && column._count.studentGrades > 0) {
        throw new Error("Cannot delete column that has grades");
    }
    return client_1.prisma.gradeColumn.delete({
        where: { id },
    });
}
async function assignAttendanceSessions(columnId, sessionIds) {
    try {
        console.log("🟢 assignAttendanceSessions called", {
            columnId,
            sessionIds,
        });
        // Xóa assignments cũ
        const del = await client_1.prisma.gradeColumnAttendanceSession.deleteMany({
            where: { gradeColumnId: columnId },
        });
        console.log("🟡 Deleted old sessions:", del);
        // Tạo mới
        const result = await client_1.prisma.gradeColumnAttendanceSession.createMany({
            data: sessionIds.map((item) => ({
                gradeColumnId: columnId,
                sessionId: item.sessionId,
                weight: item.weight ?? 1,
            })),
        });
        console.log("🟡 Created new sessions:", result);
        // Tính lại điểm tự động
        await recalculateColumnGrades(columnId);
        return result;
    }
    catch (err) {
        console.error("❌ Prisma error in assignAttendanceSessions:", {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack,
        });
        throw err;
    }
}
async function assignAssignments(columnId, assignmentIds) {
    // Xóa assignments cũ
    await client_1.prisma.gradeColumnAssignment.deleteMany({
        where: { gradeColumnId: columnId },
    });
    // Tạo mới
    const result = await client_1.prisma.gradeColumnAssignment.createMany({
        data: assignmentIds.map((item) => ({
            gradeColumnId: columnId,
            assignmentId: item.assignmentId,
            weight: item.weight ?? 1,
        })),
    });
    // Tính lại điểm
    await recalculateColumnGrades(columnId);
    return result;
}
async function recalculateColumnGrades(columnId) {
    const column = await client_1.prisma.gradeColumn.findUnique({
        where: { id: columnId },
        include: {
            section: {
                include: {
                    enrollments: {
                        where: { status: "enrolled" },
                        select: { studentId: true },
                    },
                },
            },
            attendanceSessions: {
                include: {
                    session: {
                        include: {
                            attendances: true,
                        },
                    },
                },
            },
            assignments: {
                include: {
                    assignment: {
                        include: {
                            submissions: true,
                        },
                    },
                },
            },
        },
    });
    if (!column) {
        throw new Error("Column not found");
    }
    const studentIds = column.section.enrollments.map((e) => e.studentId);
    const results = [];
    for (const studentId of studentIds) {
        let score = null;
        if (column.type === "attendance" &&
            column.attendanceSessions.length > 0) {
            score = calculateAttendanceScore(column, studentId);
        }
        else if (["assignment", "midterm", "final", "project"].includes(column.type) &&
            column.assignments.length > 0) {
            score = calculateAssignmentScore(column, studentId);
        }
        if (score !== null) {
            const percentage = column.maxScore > 0 ? (score / column.maxScore) * 100 : null;
            const grade = await client_1.prisma.studentGrade.upsert({
                where: {
                    gradeColumnId_studentId: {
                        gradeColumnId: columnId,
                        studentId,
                    },
                },
                create: {
                    gradeColumnId: columnId,
                    studentId,
                    score,
                    maxScore: column.maxScore,
                    percentage,
                    calculatedAt: new Date(),
                },
                update: {
                    score,
                    maxScore: column.maxScore,
                    percentage,
                    calculatedAt: new Date(),
                },
            });
            results.push(grade);
        }
    }
    return results;
}
function calculateAttendanceScore(column, studentId) {
    const statusWeights = {
        present: 1.0,
        late: 0.5,
        absent: 0,
        excused: 0.8,
    };
    let totalScore = 0;
    let totalWeight = 0;
    for (const sessionLink of column.attendanceSessions) {
        const attendance = sessionLink.session.attendances.find((att) => att.studentId === studentId);
        const status = attendance?.status || "absent";
        const weight = sessionLink.weight || 1;
        totalScore += (statusWeights[status] || 0) * weight;
        totalWeight += weight;
    }
    if (totalWeight === 0)
        return 0;
    let finalScore = 0;
    switch (column.calculationMethod) {
        case "average":
        case "weighted_average":
            finalScore = (totalScore / totalWeight) * column.maxScore;
            break;
        case "sum":
            finalScore = totalScore;
            break;
        case "percentage":
            finalScore = (totalScore / totalWeight) * 100;
            break;
        default:
            finalScore = (totalScore / totalWeight) * column.maxScore;
    }
    return Math.round(finalScore * 100) / 100;
}
function calculateAssignmentScore(column, studentId) {
    const scores = [];
    for (const assignmentLink of column.assignments) {
        const submission = assignmentLink.assignment.submissions.find((sub) => sub.studentId === studentId);
        const score = submission?.score || 0;
        const maxScore = assignmentLink.assignment.maxScore || 100;
        const weight = assignmentLink.weight || 1;
        // Normalize score to percentage
        const normalizedScore = (score / maxScore) * 100;
        scores.push(normalizedScore * weight);
    }
    if (scores.length === 0)
        return 0;
    // Sort scores for best_n and drop calculations
    scores.sort((a, b) => b - a);
    // Apply dropLowest
    if (column.dropLowest && column.dropLowest > 0) {
        scores.splice(-column.dropLowest);
    }
    // Apply bestNCount
    if (column.bestNCount &&
        column.bestNCount > 0 &&
        scores.length > column.bestNCount) {
        scores.splice(column.bestNCount);
    }
    let finalScore = 0;
    switch (column.calculationMethod) {
        case "average":
            finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            break;
        case "weighted_average":
            const totalWeight = column.assignments.reduce((sum, a) => sum + (a.weight || 1), 0);
            finalScore = scores.reduce((a, b) => a + b, 0) / totalWeight;
            break;
        case "sum":
            finalScore = scores.reduce((a, b) => a + b, 0);
            break;
        case "best_n":
            finalScore =
                scores
                    .slice(0, column.bestNCount || 1)
                    .reduce((a, b) => a + b, 0) / (column.bestNCount || 1);
            break;
        case "highest":
            finalScore = Math.max(...scores);
            break;
        case "latest":
            finalScore = scores[scores.length - 1] || 0;
            break;
        default:
            finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    // Convert percentage back to maxScore scale
    finalScore = (finalScore / 100) * column.maxScore;
    return Math.round(finalScore * 100) / 100;
}
