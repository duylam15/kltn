import { prisma } from "../../prisma/client";
import {
    GradeColumnType,
    AttendanceScoreMethod,
    AssignmentScoreMethod,
} from "@prisma/client";

interface CreateColumnData {
    name: string;
    type: GradeColumnType;
    weight: number;
    maxScore: number;
    order?: number;
    isVisible?: boolean;
    isEditable?: boolean;
    isAutoCalculated?: boolean;
    autoUpdate?: boolean;
    attendanceScoreMethod?: AttendanceScoreMethod;
    attendanceConfig?: any;
    assignmentScoreMethod?: AssignmentScoreMethod;
    assignmentConfig?: any;
    description?: string;
}

export async function listColumnsBySection(sectionId: number) {
    return prisma.gradeColumn.findMany({
        where: { sectionId },
        include: {
            attendanceSessions: {
                include: {
                    session: {
                        select: {
                            id: true,
                            name: true,
                            sessionCode: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { order: "asc" },
            },
            assignments: {
                include: {
                    assignment: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            maxScore: true,
                            dueDate: true,
                        },
                    },
                },
                orderBy: { order: "asc" },
            },
            _count: {
                select: { grades: true },
            },
        },
        orderBy: { order: "asc" },
    });
}

export async function createColumn(sectionId: number, data: CreateColumnData) {
    // Lấy order cao nhất hiện tại
    const maxOrder = await prisma.gradeColumn.findFirst({
        where: { sectionId },
        orderBy: { order: "desc" },
        select: { order: true },
    });

    return prisma.gradeColumn.create({
        data: {
            sectionId,
            name: data.name,
            type: data.type,
            weight: data.weight,
            maxScore: data.maxScore,
            order: data.order ?? (maxOrder?.order ?? 0) + 1,
            isVisible: data.isVisible ?? true,
            isEditable: data.isEditable ?? true,
            isAutoCalculated: data.isAutoCalculated ?? false,
            autoUpdate: data.autoUpdate ?? true,
            attendanceScoreMethod: data.attendanceScoreMethod,
            attendanceConfig: data.attendanceConfig,
            assignmentScoreMethod: data.assignmentScoreMethod,
            assignmentConfig: data.assignmentConfig,
            description: data.description,
        },
        include: {
            attendanceSessions: true,
            assignments: true,
        },
    });
}

export async function updateColumn(
    id: number,
    data: Partial<CreateColumnData>
) {
    return prisma.gradeColumn.update({
        where: { id },
        data,
        include: {
            attendanceSessions: true,
            assignments: true,
        },
    });
}

export async function deleteColumn(id: number) {
    // Check if column has grades
    const column = await prisma.gradeColumn.findUnique({
        where: { id },
        include: {
            _count: {
                select: { grades: true },
            },
        },
    });

    if (column?._count?.grades && column._count.grades > 0) {
        throw new Error("Cannot delete column that has grades");
    }

    return prisma.gradeColumn.delete({
        where: { id },
    });
}

export async function assignAttendanceSessions(
    columnId: number,
    sessionIds: Array<{
        sessionId: number;
        weight?: number;
        isRequired?: boolean;
        order?: number;
    }>
) {
    try {
        console.log("🟢 assignAttendanceSessions called", {
            columnId,
            sessionIds,
        });

        // Xóa assignments cũ
        const del = await prisma.gradeColumnAttendanceSession.deleteMany({
            where: { gradeColumnId: columnId },
        });
        console.log("🟡 Deleted old sessions:", del);

        // Tạo mới
        const result = await prisma.gradeColumnAttendanceSession.createMany({
            data: sessionIds.map((item, index) => ({
                gradeColumnId: columnId,
                sessionId: item.sessionId,
                weight: item.weight ?? 1,
                isRequired: item.isRequired ?? true,
                order: item.order ?? index,
            })),
        });
        console.log("🟡 Created new sessions:", result);

        // Check column tồn tại
        const column = await prisma.gradeColumn.findUnique({
            where: { id: columnId },
        });
        console.log("🟡 Found column:", column);

        if (column?.autoUpdate) {
            console.log("🟡 Recalculating grades...");
            await recalculateColumnGrades(columnId);
        }

        return result;
    } catch (err: any) {
        console.error("❌ Prisma error in assignAttendanceSessions:", {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack,
        });
        throw err; // vẫn ném ra ngoài để controller bắt
    }
}


export async function assignAssignments(
    columnId: number,
    assignmentIds: Array<{
        assignmentId: number;
        weight?: number;
        isRequired?: boolean;
        isExtraCredit?: boolean;
        order?: number;
    }>
) {
    // Xóa assignments cũ
    await prisma.gradeColumnAssignment.deleteMany({
        where: { gradeColumnId: columnId },
    });

    // Tạo mới
    const result = await prisma.gradeColumnAssignment.createMany({
        data: assignmentIds.map((item, index) => ({
            gradeColumnId: columnId,
            assignmentId: item.assignmentId,
            weight: item.weight ?? 1,
            isRequired: item.isRequired ?? true,
            isExtraCredit: item.isExtraCredit ?? false,
            order: item.order ?? index,
        })),
    });

    // Nếu column có autoUpdate = true, tính lại điểm
    const column = await prisma.gradeColumn.findUnique({
        where: { id: columnId },
    });

    if (column?.autoUpdate) {
        await recalculateColumnGrades(columnId);
    }

    return result;
}

export async function recalculateColumnGrades(columnId: number) {
    const column = await prisma.gradeColumn.findUnique({
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

    if (!column || !column.isAutoCalculated) {
        throw new Error("Column not found or not auto-calculated");
    }

    const studentIds = column.section.enrollments.map((e) => e.studentId);
    const results = [];

    for (const studentId of studentIds) {
        let score: number | null = null;
        let calculationDetail: any = null;

        if (
            column.type === "attendance" &&
            column.attendanceSessions.length > 0
        ) {
            const result = calculateAttendanceScore(column, studentId);
            score = result.score;
            calculationDetail = result.detail;
        } else if (
            ["assignment", "quiz", "midterm", "final", "project"].includes(
                column.type
            ) &&
            column.assignments.length > 0
        ) {
            const result = calculateAssignmentScore(column, studentId);
            score = result.score;
            calculationDetail = result.detail;
        }

        if (score !== null) {
            const grade = await prisma.grade.upsert({
                where: {
                    columnId_studentId: {
                        columnId,
                        studentId,
                    },
                },
                create: {
                    columnId,
                    studentId,
                    score,
                    maxScore: column.maxScore,
                    isAutoCalculated: true,
                    calculationDetail,
                    lastAutoUpdate: new Date(),
                },
                update: {
                    score,
                    isAutoCalculated: true,
                    calculationDetail,
                    lastAutoUpdate: new Date(),
                },
            });

            results.push(grade);
        }
    }

    // Update lastCalculated
    await prisma.gradeColumn.update({
        where: { id: columnId },
        data: { lastCalculated: new Date() },
    });

    return results;
}

function calculateAttendanceScore(column: any, studentId: number) {
    const config = column.attendanceConfig || {};
    const statusWeights = config.statusWeights || {
        present: 1.0,
        late: 0.5,
        absent: 0,
        warning: 0.3,
    };

    const sessions = column.attendanceSessions.map((as: any) => {
        const attendance = as.session.attendances.find(
            (att: any) => att.studentId === studentId
        );
        const status = attendance?.status || "absent";
        const weight = as.weight || 1;

        return {
            sessionId: as.session.id,
            sessionName: as.session.name,
            status,
            weight,
            score: statusWeights[status] * weight,
        };
    });

    const totalScore = sessions.reduce(
        (sum: number, s: any) => sum + s.score,
        0
    );
    const totalWeight = sessions.reduce(
        (sum: number, s: any) => sum + s.weight,
        0
    );

    let finalScore = 0;

    switch (column.attendanceScoreMethod) {
        case "percentage":
            finalScore =
                totalWeight > 0
                    ? (totalScore / totalWeight) * column.maxScore
                    : 0;
            break;
        case "count":
            finalScore = totalScore;
            break;
        case "deduction":
            const absences = sessions.filter(
                (s: any) => s.status === "absent"
            ).length;
            const deductionPerAbsence = config.deductionPerAbsence || 1;
            finalScore = Math.max(
                0,
                column.maxScore - absences * deductionPerAbsence
            );
            break;
        case "weighted":
            finalScore = totalScore;
            break;
        default:
            finalScore =
                totalWeight > 0
                    ? (totalScore / totalWeight) * column.maxScore
                    : 0;
    }

    // Rounding
    const roundingRule = config.roundingRule || "round";
    if (roundingRule === "ceil") {
        finalScore = Math.ceil(finalScore);
    } else if (roundingRule === "floor") {
        finalScore = Math.floor(finalScore);
    } else {
        finalScore = Math.round(finalScore * 100) / 100;
    }

    finalScore = Math.max(
        config.minScore || 0,
        Math.min(column.maxScore, finalScore)
    );

    return {
        score: finalScore,
        detail: {
            method: column.attendanceScoreMethod,
            sessions,
            totalScore,
            totalWeight,
            finalScore,
        },
    };
}

function calculateAssignmentScore(column: any, studentId: number) {
    const config = column.assignmentConfig || {};

    const assignments = column.assignments.map((ca: any) => {
        const submission = ca.assignment.submissions.find(
            (sub: any) => sub.studentId === studentId
        );
        const score = submission?.score || 0;
        const maxScore = ca.assignment.maxScore || 100;
        const weight = ca.weight || 1;
        const isExtraCredit = ca.isExtraCredit || false;

        return {
            assignmentId: ca.assignment.id,
            title: ca.assignment.title,
            score,
            maxScore,
            weight,
            isExtraCredit,
            normalizedScore: (score / maxScore) * 10, // Chuẩn hóa về thang 10
        };
    });

    // Filter required assignments
    const requiredAssignments = assignments.filter(
        (a: any) => !a.isExtraCredit
    );
    const extraCreditAssignments = assignments.filter(
        (a: any) => a.isExtraCredit
    );

    // Drop lowest/highest if configured
    const dropLowest = config.dropLowest || 0;
    const dropHighest = config.dropHighest || 0;

    let scoresToUse = [...requiredAssignments];
    scoresToUse.sort((a: any, b: any) => a.normalizedScore - b.normalizedScore);

    if (dropLowest > 0) {
        scoresToUse = scoresToUse.slice(dropLowest);
    }
    if (dropHighest > 0) {
        scoresToUse = scoresToUse.slice(0, -dropHighest);
    }

    let finalScore = 0;

    switch (column.assignmentScoreMethod) {
        case "average":
            if (scoresToUse.length > 0) {
                const sum = scoresToUse.reduce(
                    (s: number, a: any) => s + a.normalizedScore,
                    0
                );
                finalScore = sum / scoresToUse.length;
            }
            break;
        case "weighted":
            const totalWeight = scoresToUse.reduce(
                (s: number, a: any) => s + a.weight,
                0
            );
            if (totalWeight > 0) {
                const weightedSum = scoresToUse.reduce(
                    (s: number, a: any) => s + a.normalizedScore * a.weight,
                    0
                );
                finalScore = weightedSum / totalWeight;
            }
            break;
        case "best":
            if (scoresToUse.length > 0) {
                finalScore = Math.max(
                    ...scoresToUse.map((a: any) => a.normalizedScore)
                );
            }
            break;
        case "latest":
            if (scoresToUse.length > 0) {
                finalScore =
                    scoresToUse[scoresToUse.length - 1].normalizedScore;
            }
            break;
        case "total":
            finalScore = scoresToUse.reduce(
                (s: number, a: any) => s + a.normalizedScore,
                0
            );
            break;
        default:
            if (scoresToUse.length > 0) {
                const sum = scoresToUse.reduce(
                    (s: number, a: any) => s + a.normalizedScore,
                    0
                );
                finalScore = sum / scoresToUse.length;
            }
    }

    // Add extra credit
    if (config.extraCredit && extraCreditAssignments.length > 0) {
        const extraCredit = extraCreditAssignments.reduce(
            (s: number, a: any) => s + a.normalizedScore * a.weight,
            0
        );
        finalScore += extraCredit;
    }

    // Rounding
    const roundingRule = config.roundingRule || "round";
    if (roundingRule === "ceil") {
        finalScore = Math.ceil(finalScore);
    } else if (roundingRule === "floor") {
        finalScore = Math.floor(finalScore);
    } else {
        finalScore = Math.round(finalScore * 100) / 100;
    }

    finalScore = Math.max(
        config.minScore || 0,
        Math.min(column.maxScore, finalScore)
    );

    return {
        score: finalScore,
        detail: {
            method: column.assignmentScoreMethod,
            assignments,
            requiredAssignments: scoresToUse,
            extraCreditAssignments,
            finalScore,
        },
    };
}
