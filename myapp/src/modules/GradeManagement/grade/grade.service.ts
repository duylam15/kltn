import { prisma } from "@/prisma/client";
import {
    GradeColumnType,
    GradeCalculationMethod,
    AttendanceStatus,
} from "@prisma/client";

// ========== GRADE COLUMN ==========

export async function createGradeColumn(data: {
    sectionId: number;
    name: string;
    type: GradeColumnType;
    description?: string;
    maxScore?: number;
    weight?: number;
    calculationMethod?: GradeCalculationMethod;
    bestNCount?: number;
    dropLowest?: number;
    isPublished?: boolean;
    displayOrder?: number;
}) {
    return prisma.gradeColumn.create({
        data,
        include: {
            attendanceSessions: {
                include: {
                    session: true,
                },
            },
            assignments: {
                include: {
                    assignment: true,
                },
            },
        },
    });
}

export async function addColumnsToColumn(
    parentColumnId: number,
    childColumnIds: number[],
    weight?: number
) {
    const data = childColumnIds.map((childColumnId) => ({
        parentColumnId,
        childColumnId,
        weight: weight ?? 1,
    }));

    return prisma.gradeColumnLink.createMany({
        data,
        skipDuplicates: true,
    });
}

export async function removeColumnFromColumn(
    parentColumnId: number,
    childColumnId: number
) {
    return prisma.gradeColumnLink.deleteMany({
        where: {
            parentColumnId,
            childColumnId,
        },
    });
}

export async function getColumnsInColumn(parentColumnId: number) {
    return prisma.gradeColumnLink.findMany({
        where: { parentColumnId },
        include: {
            childColumn: {
                include: {
                    studentGrades: true,
                },
            },
        },
    });
}

// Cập nhật hàm tính điểm từ các cột khác
async function calculateFromOtherColumns(
    gradeColumn: any,
    studentId: number
): Promise<number | null> {
    const linkedColumns = await prisma.gradeColumnLink.findMany({
        where: { parentColumnId: gradeColumn.id },
        include: {
            childColumn: {
                include: {
                    studentGrades: {
                        where: { studentId },
                    },
                },
            },
        },
    });

    console.log(
        `[calculateFromOtherColumns] Column: ${gradeColumn.name}, Student: ${studentId}`
    );
    console.log(
        `[calculateFromOtherColumns] Found ${linkedColumns.length} linked columns`
    );

    if (linkedColumns.length === 0) {
        console.log(
            `[calculateFromOtherColumns] No linked columns found, returning null`
        );
        return null;
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let hasAnyScore = false;

    for (const link of linkedColumns) {
        const studentGrade = link.childColumn.studentGrades[0];

        console.log(
            `[calculateFromOtherColumns] Processing column: ${link.childColumn.name}`
        );
        console.log(`[calculateFromOtherColumns] Student grade:`, studentGrade);

        if (!studentGrade) {
            console.log(
                `[calculateFromOtherColumns] No grade found for column ${link.childColumn.name}`
            );
            continue;
        }

        // Lấy điểm (ưu tiên điểm ghi đè)
        const score = studentGrade.isOverridden
            ? studentGrade.overriddenScore
            : studentGrade.score;

        if (score === null || score === undefined) {
            console.log(
                `[calculateFromOtherColumns] Score is null for column ${link.childColumn.name}`
            );
            continue;
        }

        hasAnyScore = true;

        // Tính phần trăm điểm của cột con
        const percentage = (score / link.childColumn.maxScore) * 100;
        console.log(
            `[calculateFromOtherColumns] Score: ${score}/${link.childColumn.maxScore} = ${percentage}%`
        );

        // Dùng weight của cột con (hoặc weight được gán trong link)
        const weight = link.childColumn.weight ?? link.weight ?? 1;
        console.log(`[calculateFromOtherColumns] Using weight: ${weight}`);

        totalWeightedScore += percentage * weight;
        totalWeight += weight;
    }

    console.log(
        `[calculateFromOtherColumns] Total weighted score: ${totalWeightedScore}, Total weight: ${totalWeight}`
    );

    if (!hasAnyScore || totalWeight === 0) {
        console.log(
            `[calculateFromOtherColumns] No valid scores or zero weight, returning null`
        );
        return null;
    }

    // Tính điểm trung bình có trọng số
    const weightedAveragePercentage = totalWeightedScore / totalWeight;
    console.log(
        `[calculateFromOtherColumns] Weighted average: ${weightedAveragePercentage}%`
    );

    // Chuyển đổi về thang điểm của cột cha
    const finalScore = (weightedAveragePercentage / 100) * gradeColumn.maxScore;
    console.log(
        `[calculateFromOtherColumns] Final score: ${finalScore}/${gradeColumn.maxScore}`
    );

    return finalScore;
}

export async function calculateAndSaveStudentGrades(
    gradeColumnId: number,
    studentIds?: number[]
) {
    const gradeColumn = await prisma.gradeColumn.findUnique({
        where: { id: gradeColumnId },
        include: {
            section: {
                include: {
                    enrollments: {
                        where: studentIds
                            ? { studentId: { in: studentIds } }
                            : {},
                        include: { student: true },
                    },
                },
            },
        },
    });

    if (!gradeColumn) throw new Error("Grade column not found");

    const results = [];

    for (const enrollment of gradeColumn.section.enrollments) {
        const studentId = enrollment.studentId;

        let score: number | null = null;

        // Tính điểm dựa trên type
        if (gradeColumn.type === "attendance") {
            score = await calculateAttendanceScore(gradeColumn, studentId);
        } else if (gradeColumn.type === "assignment") {
            score = await calculateAssignmentScore(gradeColumn, studentId);
        } else if (
            gradeColumn.type === "midterm" ||
            gradeColumn.type === "final" ||
            gradeColumn.type === "custom"
        ) {
            // Tính từ các cột khác
            score = await calculateFromOtherColumns(gradeColumn, studentId);
        }

        // Tính percentage dựa trên maxScore của cột
        // VD: score = 10, maxScore = 10 => percentage = 100%
        const percentage =
            score !== null ? (score / gradeColumn.maxScore) * 100 : null;

        // Upsert StudentGrade
        const studentGrade = await prisma.studentGrade.upsert({
            where: {
                gradeColumnId_studentId: {
                    gradeColumnId,
                    studentId,
                },
            },
            update: {
                score, // Điểm thực tế (VD: 10/10)
                maxScore: gradeColumn.maxScore,
                percentage, // Phần trăm (VD: 100%)
                calculatedAt: new Date(),
                ...(score === null && {
                    isOverridden: false,
                    overriddenScore: null,
                    overriddenBy: null,
                    overriddenAt: null,
                }),
            },
            create: {
                gradeColumnId,
                studentId,
                score,
                maxScore: gradeColumn.maxScore,
                percentage,
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        results.push(studentGrade);
    }

    return results;
}

export async function getGradeColumnsBySection(sectionId: number) {
    return prisma.gradeColumn.findMany({
        where: { sectionId },
        include: {
            attendanceSessions: {
                include: {
                    session: true,
                },
            },
            assignments: {
                include: {
                    assignment: true,
                },
            },
            parentLinks: {
                include: {
                    childColumn: true,
                },
            },
            studentGrades: {
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    studentCode: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            { displayOrder: "asc" }, // Sắp xếp theo displayOrder trước
            { createdAt: "asc" }, // Nếu displayOrder bằng nhau thì theo thời gian tạo
        ],
    });
}

export async function getGradeColumnById(id: number) {
    return prisma.gradeColumn.findUnique({
        where: { id },
        include: {
            attendanceSessions: {
                include: {
                    session: true,
                },
            },
            assignments: {
                include: {
                    assignment: true,
                },
            },
            studentGrades: {
                include: {
                    student: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
    });
}

export async function updateGradeColumn(id: number, data: any) {
    return prisma.gradeColumn.update({
        where: { id },
        data,
    });
}

export async function deleteGradeColumn(id: number) {
    return prisma.gradeColumn.delete({
        where: { id },
    });
}

// ========== GRADE COLUMN - ATTENDANCE SESSION ==========

export async function addAttendanceSessionsToColumn(
    gradeColumnId: number,
    sessionIds: number[],
    weight?: number
) {
    const data = sessionIds.map((sessionId) => ({
        gradeColumnId,
        sessionId,
        weight: weight ?? 1,
    }));

    return prisma.gradeColumnAttendanceSession.createMany({
        data,
        skipDuplicates: true,
    });
}

export async function removeAttendanceSessionFromColumn(
    gradeColumnId: number,
    sessionId: number
) {
    return prisma.gradeColumnAttendanceSession.deleteMany({
        where: {
            gradeColumnId,
            sessionId,
        },
    });
}

export async function getAttendanceSessionsInColumn(gradeColumnId: number) {
    return prisma.gradeColumnAttendanceSession.findMany({
        where: { gradeColumnId },
        include: {
            session: {
                include: {
                    attendances: {
                        include: {
                            student: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

// ========== GRADE COLUMN - ASSIGNMENT ==========

export async function addAssignmentsToColumn(
    gradeColumnId: number,
    assignmentIds: number[],
    weight?: number
) {
    const data = assignmentIds.map((assignmentId) => ({
        gradeColumnId,
        assignmentId,
        weight: weight ?? 1,
    }));

    return prisma.gradeColumnAssignment.createMany({
        data,
        skipDuplicates: true,
    });
}

export async function removeAssignmentFromColumn(
    gradeColumnId: number,
    assignmentId: number
) {
    return prisma.gradeColumnAssignment.deleteMany({
        where: {
            gradeColumnId,
            assignmentId,
        },
    });
}

export async function getAssignmentsInColumn(gradeColumnId: number) {
    return prisma.gradeColumnAssignment.findMany({
        where: { gradeColumnId },
        include: {
            assignment: {
                include: {
                    submissions: {
                        include: {
                            student: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

// ========== STUDENT GRADE - CALCULATION ==========

// Tính điểm từ attendance
async function calculateAttendanceScore(
    gradeColumn: any,
    studentId: number
): Promise<number | null> {
    const attendanceSessions =
        await prisma.gradeColumnAttendanceSession.findMany({
            where: { gradeColumnId: gradeColumn.id },
            include: {
                session: {
                    include: {
                        attendances: {
                            where: { studentId },
                        },
                    },
                },
            },
        });

    if (attendanceSessions.length === 0) return null;

    const scores: number[] = [];
    const weights: number[] = [];

    for (const item of attendanceSessions) {
        const attendance = item.session.attendances[0];
        if (!attendance) continue;

        // Quy đổi status thành điểm phần trăm
        let scorePercentage = 0;
        if (attendance.status === "present") scorePercentage = 100;
        else if (attendance.status === "late") scorePercentage = 50;
        else if (attendance.status === "warning") scorePercentage = 70;
        else if (attendance.status === "absent") scorePercentage = 0;

        // Hoặc dùng score từ attendance nếu có
        if (attendance.score !== null && attendance.score !== undefined) {
            scorePercentage = attendance.score;
        }

        scores.push(scorePercentage);
        weights.push(item.weight ?? 1);
    }

    if (scores.length === 0) return null;

    // Tính điểm phần trăm trung bình
    const averagePercentage = calculateFinalScore(
        scores,
        weights,
        gradeColumn.calculationMethod,
        gradeColumn.bestNCount,
        gradeColumn.dropLowest
    );

    if (averagePercentage === null) return null;

    // Chuyển đổi về thang điểm của cột
    // VD: averagePercentage = 100%, maxScore = 10 => score = 10
    return (averagePercentage / 100) * gradeColumn.maxScore;
}

// Tính điểm từ assignment
async function calculateAssignmentScore(
    gradeColumn: any,
    studentId: number
): Promise<number | null> {
    const assignments = await prisma.gradeColumnAssignment.findMany({
        where: { gradeColumnId: gradeColumn.id },
        include: {
            assignment: {
                include: {
                    submissions: {
                        where: { studentId },
                    },
                },
            },
        },
    });

    if (assignments.length === 0) return null;

    const scores: number[] = [];
    const weights: number[] = [];

    for (const item of assignments) {
        const submission = item.assignment.submissions[0];
        if (!submission || submission.score === null) continue;

        // Tính phần trăm điểm của bài tập
        const percentage =
            (submission.score /
                (submission.maxScore ?? item.assignment.maxScore)) *
            100;

        scores.push(percentage);
        weights.push(item.weight ?? 1);
    }

    if (scores.length === 0) return null;

    // Tính điểm phần trăm trung bình
    const averagePercentage = calculateFinalScore(
        scores,
        weights,
        gradeColumn.calculationMethod,
        gradeColumn.bestNCount,
        gradeColumn.dropLowest
    );

    if (averagePercentage === null) return null;

    // Chuyển đổi về thang điểm của cột
    return (averagePercentage / 100) * gradeColumn.maxScore;
}

// Logic tính điểm cuối cùng
function calculateFinalScore(
    scores: number[],
    weights: number[],
    method: GradeCalculationMethod,
    bestNCount?: number | null,
    dropLowest?: number | null
): number | null {
    if (scores.length === 0) return null;

    // Loại bỏ N điểm thấp nhất
    if (dropLowest && dropLowest > 0) {
        const paired = scores.map((s, i) => ({ score: s, weight: weights[i] }));
        paired.sort((a, b) => a.score - b.score);
        const dropped = paired.slice(dropLowest);
        scores = dropped.map((p) => p.score);
        weights = dropped.map((p) => p.weight);
    }

    // Lấy N điểm cao nhất
    if (method === "best_n" && bestNCount && bestNCount > 0) {
        const paired = scores.map((s, i) => ({ score: s, weight: weights[i] }));
        paired.sort((a, b) => b.score - a.score);
        const best = paired.slice(0, bestNCount);
        scores = best.map((p) => p.score);
        weights = best.map((p) => p.weight);
    }

    switch (method) {
        case "average":
            return scores.reduce((sum, s) => sum + s, 0) / scores.length;

        case "weighted_average": {
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            const weightedSum = scores.reduce(
                (sum, s, i) => sum + s * weights[i],
                0
            );
            return totalWeight > 0 ? weightedSum / totalWeight : null;
        }

        case "sum":
            return scores.reduce((sum, s) => sum + s, 0);

        case "latest":
            return scores[scores.length - 1];

        case "highest":
            return Math.max(...scores);

        case "percentage":
            return scores.reduce((sum, s) => sum + s, 0) / scores.length;

        default:
            return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }
}

// ========== STUDENT GRADE - QUERIES ==========

export async function getStudentGradesByColumn(gradeColumnId: number) {
    return prisma.studentGrade.findMany({
        where: { gradeColumnId },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            studentCode: true,
                        },
                    },
                },
            },
            overriddenByUser: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
        orderBy: {
            student: {
                user: {
                    fullName: "asc",
                },
            },
        },
    });
}

export async function getStudentGrade(
    gradeColumnId: number,
    studentId: number
) {
    return prisma.studentGrade.findUnique({
        where: {
            gradeColumnId_studentId: {
                gradeColumnId,
                studentId,
            },
        },
        include: {
            student: {
                include: {
                    user: true,
                },
            },
            gradeColumn: true,
            overriddenByUser: true,
        },
    });
}

// Ghi đè điểm thủ công
export async function overrideStudentGrade(
    gradeColumnId: number,
    studentId: number,
    overriddenScore: number,
    overriddenBy?: number,
    note?: string
) {
    return prisma.studentGrade.upsert({
        where: {
            gradeColumnId_studentId: {
                gradeColumnId,
                studentId,
            },
        },
        update: {
            isOverridden: true,
            overriddenScore,
            overriddenBy,
            overriddenAt: new Date(),
            note,
        },
        create: {
            gradeColumnId,
            studentId,
            isOverridden: true,
            overriddenScore,
            overriddenBy,
            overriddenAt: new Date(),
            note,
        },
    });
}

// Xóa ghi đè
export async function removeGradeOverride(
    gradeColumnId: number,
    studentId: number
) {
    return prisma.studentGrade.update({
        where: {
            gradeColumnId_studentId: {
                gradeColumnId,
                studentId,
            },
        },
        data: {
            isOverridden: false,
            overriddenScore: null,
            overriddenBy: null,
            overriddenAt: null,
        },
    });
}

// Lấy toàn bộ bảng điểm
export async function getSectionGradeBook(
    sectionId: number,
    includeUnpublished = false
) {
    const gradeColumns = await prisma.gradeColumn.findMany({
        where: {
            sectionId,
            ...(includeUnpublished ? {} : { isPublished: true }),
        },
        include: {
            studentGrades: {
                include: {
                    student: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    const enrollments = await prisma.sectionEnrollment.findMany({
        where: { sectionId },
        include: {
            student: {
                include: {
                    user: true,
                },
            },
        },
    });

    // Tạo ma trận điểm
    const gradeBook = enrollments.map((enrollment) => {
        const student = enrollment.student;
        const grades: any = {
            studentId: student.id,
            studentCode: student.studentCode,
            fullName: student.user.fullName,
            email: student.user.email,
            columns: {},
        };

        gradeColumns.forEach((column) => {
            const studentGrade = column.studentGrades.find(
                (sg) => sg.studentId === student.id
            );

            grades.columns[column.name] = {
                columnId: column.id,
                score: studentGrade?.isOverridden
                    ? studentGrade.overriddenScore
                    : studentGrade?.score,
                maxScore: studentGrade?.maxScore ?? column.maxScore,
                percentage: studentGrade?.percentage,
                isOverridden: studentGrade?.isOverridden ?? false,
                note: studentGrade?.note,
            };
        });

        return grades;
    });

    return {
        columns: gradeColumns,
        students: gradeBook,
    };
}

// Lấy điểm của sinh viên trong section
export async function getStudentGradesInSection(
    sectionId: number,
    studentId: number
) {
    const gradeColumns = await prisma.gradeColumn.findMany({
        where: {
            sectionId,
            isPublished: true,
        },
        include: {
            studentGrades: {
                where: { studentId },
            },
        },
        orderBy: { displayOrder: "asc" },
    });

    return gradeColumns.map((column) => ({
        column: {
            id: column.id,
            name: column.name,
            type: column.type,
            maxScore: column.maxScore,
            weight: column.weight,
        },
        grade: column.studentGrades[0] || null,
    }));
}

// Export CSV
export async function exportGradesToCSV(sectionId: number) {
    const gradeBook = await getSectionGradeBook(sectionId, false);

    let csv = "Student Code,Full Name,Email";
    gradeBook.columns.forEach((col) => {
        csv += `,${col.name}`;
    });
    csv += "\n";

    gradeBook.students.forEach((student: any) => {
        csv += `${student.studentCode},${student.fullName},${student.email}`;
        gradeBook.columns.forEach((col) => {
            const grade = student.columns[col.name];
            csv += `,${grade?.score ?? ""}`;
        });
        csv += "\n";
    });

    return csv;
}
