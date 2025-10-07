import { prisma } from "../../prisma/client";

export async function getGradesBySection(sectionId: number) {
    const columns = await prisma.gradeColumn.findMany({
        where: { sectionId, isVisible: true },
        orderBy: { order: "asc" },
    });

    const enrollments = await prisma.sectionEnrollment.findMany({
        where: { sectionId, status: "enrolled" },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            student: {
                studentCode: "asc",
            },
        },
    });

    const grades = await prisma.grade.findMany({
        where: {
            columnId: {
                in: columns.map((c) => c.id),
            },
            studentId: {
                in: enrollments.map((e) => e.studentId),
            },
        },
    });

    const gradeSummaries = await prisma.gradeSummary.findMany({
        where: {
            sectionId,
            studentId: {
                in: enrollments.map((e) => e.studentId),
            },
        },
    });

    return {
        columns,
        students: enrollments.map((e) => {
            const studentGrades = grades.filter(
                (g) => g.studentId === e.studentId
            );
            const summary = gradeSummaries.find(
                (s) => s.studentId === e.studentId
            );

            return {
                studentId: e.studentId,
                studentCode: e.student.studentCode,
                fullName: e.student.user.fullName,
                email: e.student.user.email,
                grades: columns.map((col) => {
                    const grade = studentGrades.find(
                        (g) => g.columnId === col.id
                    );
                    return {
                        columnId: col.id,
                        score: grade?.score,
                        maxScore: grade?.maxScore || col.maxScore,
                        note: grade?.note,
                        isExcused: grade?.isExcused,
                        isAutoCalculated: grade?.isAutoCalculated,
                    };
                }),
                summary: {
                    totalScore: summary?.totalScore,
                    finalGrade: summary?.finalGrade,
                    gpa: summary?.gpa,
                    rank: summary?.rank,
                    isPassed: summary?.isPassed,
                },
            };
        }),
    };
}

export async function getGradesByStudent(sectionId: number, studentId: number) {
    const columns = await prisma.gradeColumn.findMany({
        where: { sectionId, isVisible: true },
        orderBy: { order: "asc" },
    });

    const grades = await prisma.grade.findMany({
        where: {
            columnId: {
                in: columns.map((c) => c.id),
            },
            studentId,
        },
    });

    const summary = await prisma.gradeSummary.findUnique({
        where: {
            sectionId_studentId: {
                sectionId,
                studentId,
            },
        },
    });

    return {
        columns: columns.map((col) => {
            const grade = grades.find((g) => g.columnId === col.id);
            return {
                ...col,
                grade: {
                    score: grade?.score,
                    maxScore: grade?.maxScore || col.maxScore,
                    note: grade?.note,
                    isExcused: grade?.isExcused,
                    isAutoCalculated: grade?.isAutoCalculated,
                    calculationDetail: grade?.calculationDetail,
                    gradedAt: grade?.gradedAt,
                    lastModified: grade?.lastModified,
                },
            };
        }),
        summary,
    };
}

export async function updateGrade(
    columnId: number,
    studentId: number,
    data: {
        score?: number;
        note?: string;
        isExcused?: boolean;
    },
    gradedBy: number
) {
    const column = await prisma.gradeColumn.findUnique({
        where: { id: columnId },
    });

    if (!column) {
        throw new Error("Column not found");
    }

    if (!column.isEditable) {
        throw new Error("This column is not editable");
    }

    // Lưu lịch sử thay đổi
    const existingGrade = await prisma.grade.findUnique({
        where: {
            columnId_studentId: {
                columnId,
                studentId,
            },
        },
    });

    if (existingGrade) {
        await prisma.gradeHistory.create({
            data: {
                gradeId: existingGrade.id,
                columnId,
                studentId,
                oldScore: existingGrade.score,
                newScore: data.score || null,
                reason: data.note || "Manual update",
                changedBy: gradedBy,
            },
        });
    }

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
            score: data.score,
            maxScore: column.maxScore,
            note: data.note,
            isExcused: data.isExcused ?? false,
            isAutoCalculated: false,
            gradedBy,
            gradedAt: new Date(),
        },
        update: {
            score: data.score,
            note: data.note,
            isExcused: data.isExcused,
            isAutoCalculated: false,
            gradedBy,
            gradedAt: new Date(),
        },
    });

    // Recalculate summary
    await recalculateGradeSummary(column.sectionId, studentId);

    return grade;
}

export async function bulkUpdateGrades(
    grades: Array<{
        columnId: number;
        studentId: number;
        score?: number;
        note?: string;
        isExcused?: boolean;
    }>,
    gradedBy: number
) {
    const results = [];

    for (const gradeData of grades) {
        const grade = await updateGrade(
            gradeData.columnId,
            gradeData.studentId,
            {
                score: gradeData.score,
                note: gradeData.note,
                isExcused: gradeData.isExcused,
            },
            gradedBy
        );
        results.push(grade);
    }

    return results;
}

async function recalculateGradeSummary(sectionId: number, studentId: number) {
    const columns = await prisma.gradeColumn.findMany({
        where: { sectionId },
    });

    const grades = await prisma.grade.findMany({
        where: {
            columnId: {
                in: columns.map((c) => c.id),
            },
            studentId,
        },
    });

    const formula = await prisma.gradeFormula.findUnique({
        where: { sectionId },
    });

    let totalScore = 0;
    let totalWeight = 0;
    const componentScores: any = {};

    for (const column of columns) {
        const grade = grades.find((g) => g.columnId === column.id);
        if (grade && !grade.isExcused && grade.score !== null) {
            const normalizedScore = (grade.score / column.maxScore) * 10;
            totalScore += normalizedScore * (column.weight / 100);
            totalWeight += column.weight;

            // Component scores
            if (column.type === "attendance") {
                componentScores.attendanceScore = normalizedScore;
            } else if (column.type === "assignment") {
                componentScores.assignmentScore = normalizedScore;
            } else if (column.type === "midterm") {
                componentScores.midtermScore = normalizedScore;
            } else if (column.type === "final") {
                componentScores.finalScore = normalizedScore;
            }
        }
    }

    // Calculate final grade letter
    let finalGrade = "F";
    if (formula?.gradeScale) {
        const scale = formula.gradeScale as any;
        const sortedGrades = Object.entries(scale).sort(
            ([, a]: any, [, b]: any) => b - a
        );
        for (const [grade, threshold] of sortedGrades) {
            if (totalScore >= (threshold as number)) {
                finalGrade = grade as string;
                break;
            }
        }
    }

    // Calculate GPA (4.0 scale)
    const gpaMap: any = {
        A: 4.0,
        "B+": 3.5,
        B: 3.0,
        "C+": 2.5,
        C: 2.0,
        "D+": 1.5,
        D: 1.0,
        F: 0.0,
    };
    const gpa = gpaMap[finalGrade] || 0.0;

    const isPassed = totalScore >= (formula?.passingScore || 5.0);

    const summary = await prisma.gradeSummary.upsert({
        where: {
            sectionId_studentId: {
                sectionId,
                studentId,
            },
        },
        create: {
            sectionId,
            studentId,
            totalScore,
            finalGrade,
            gpa,
            isPassed,
            ...componentScores,
        },
        update: {
            totalScore,
            finalGrade,
            gpa,
            isPassed,
            ...componentScores,
        },
    });

    // Calculate rank
    await updateRankings(sectionId);

    return summary;
}

async function updateRankings(sectionId: number) {
    const summaries = await prisma.gradeSummary.findMany({
        where: { sectionId },
        orderBy: { totalScore: "desc" },
    });

    for (let i = 0; i < summaries.length; i++) {
        await prisma.gradeSummary.update({
            where: { id: summaries[i].id },
            data: { rank: i + 1 },
        });
    }
}

export async function exportGrades(sectionId: number, format: string) {
    const data = await getGradesBySection(sectionId);

    if (format === "csv") {
        // Generate CSV
        const headers = [
            "Student Code",
            "Full Name",
            ...data.columns.map((c) => c.name),
            "Total Score",
            "Final Grade",
            "GPA",
            "Rank",
        ];

        const rows = data.students.map((s) => [
            s.studentCode,
            s.fullName,
            ...s.grades.map((g) => g.score?.toString() || ""),
            s.summary.totalScore?.toString() || "",
            s.summary.finalGrade || "",
            s.summary.gpa?.toString() || "",
            s.summary.rank?.toString() || "",
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        return csv;
    }

    return data;
}
