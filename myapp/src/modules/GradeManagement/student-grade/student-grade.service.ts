import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";

export const listStudentGrades = async (params: {
    section_id: number;
    grade_column_id?: number;
    student_id?: number;
    is_overridden?: boolean;
    page: number;
    limit: number;
}) => {
    // Lấy tất cả students trong section
    const enrollments = await prisma.sectionEnrollment.findMany({
        where: {
            sectionId: params.section_id,
            status: "enrolled",
        },
        select: { studentId: true },
    });

    const studentIds = enrollments.map((e) => e.studentId);
    if (params.student_id) {
        if (!studentIds.includes(params.student_id)) {
            throw new ApiError(404, "Student not found in this section");
        }
    }

    const where: any = {
        studentId: params.student_id || { in: studentIds },
        gradeColumn: {
            sectionId: params.section_id,
        },
    };

    if (params.grade_column_id) {
        where.gradeColumnId = params.grade_column_id;
    }

    if (params.is_overridden !== undefined) {
        where.isOverridden = params.is_overridden;
    }

    const [items, total] = await Promise.all([
        prisma.studentGrade.findMany({
            where,
            skip: (params.page - 1) * params.limit,
            take: params.limit,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                studentCode: true,
                                email: true,
                            },
                        },
                    },
                },
                gradeColumn: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        maxScore: true,
                        weight: true,
                    },
                },
                overriddenByUser: {
                    select: {
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: [
                { gradeColumn: { displayOrder: "asc" } },
                { student: { user: { fullName: "asc" } } },
            ],
        }),
        prisma.studentGrade.count({ where }),
    ]);

    return { items, total };
};

export const getStudentGrade = async (params: {
    student_id: number;
    grade_column_id: number;
}) => {
    const grade = await prisma.studentGrade.findUnique({
        where: {
            studentId_gradeColumnId: {
                studentId: params.student_id,
                gradeColumnId: params.grade_column_id,
            },
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                            studentCode: true,
                            email: true,
                        },
                    },
                },
            },
            gradeColumn: {
                include: {
                    section: {
                        select: {
                            sectionCode: true,
                            sectionName: true,
                            subject: {
                                select: {
                                    subjectCode: true,
                                    subjectName: true,
                                },
                            },
                        },
                    },
                },
            },
            overriddenByUser: {
                select: {
                    fullName: true,
                    email: true,
                },
            },
        },
    });

    return grade;
};

// student-grade.service.ts

export const getSectionGradebook = async (params: {
    section_id: number;
    include_unpublished?: boolean;
}) => {
    // Get all grade columns
    const columns = await prisma.gradeColumn.findMany({
        where: {
            sectionId: params.section_id,
            ...(params.include_unpublished ? {} : { isActive: true }),
        },
        orderBy: { displayOrder: "asc" },
        select: {
            id: true,
            name: true,
            type: true,
            method: true,
            maxScore: true,
            weight: true,
            displayOrder: true,
            isActive: true,
        },
    });

    // Get all enrollments
    const enrollments = await prisma.sectionEnrollment.findMany({
        where: {
            sectionId: params.section_id,
            status: "enrolled",
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                            studentCode: true,
                            email: true,
                        },
                    },
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

    // Get all grades for this section
    const grades = await prisma.studentGrade.findMany({
        where: {
            gradeColumnId: {
                in: columns.map((c) => c.id),
            },
            studentId: {
                in: enrollments.map((e) => e.studentId),
            },
        },
    });

    // Format data for frontend
    const students = enrollments.map((enrollment) => {
        const studentGrades: Record<number, any> = {};

        columns.forEach((col) => {
            const grade = grades.find(
                (g) =>
                    g.studentId === enrollment.studentId &&
                    g.gradeColumnId === col.id
            );

            if (grade && grade.score !== null) {
                const displayScore = grade.isOverridden && grade.overriddenScore !== null
                    ?  grade.overriddenScore
                    : grade.score;
                
                const percentage = ((displayScore || 0) / grade.maxScore) * 100;

                studentGrades[col.id] = {
                    score: displayScore,
                    maxScore: grade.maxScore,
                    percentage,
                    isOverridden: grade.isOverridden,
                    note: grade.note,
                };
            } else {
                studentGrades[col.id] = null;
            }
        });

        return {
            studentCode: enrollment.student.user.studentCode,
            fullName: enrollment.student.user.fullName,
            email: enrollment. student.user.email,
            columns: studentGrades,
        };
    });

    // Add isPublished field to columns (since it doesn't exist in schema, use isActive)
    const columnsWithPublished = columns.map(col => ({
        ...col,
        isPublished: col. isActive, // Use isActive as isPublished
    }));

    return {
        columns: columnsWithPublished,
        students,
    };
};

export const updateStudentGrade = async (
    data: {
        student_id: number;
        grade_column_id: number;
        score?: number;
        override_score?: number;
        override_reason?: string;
        note?: string;
    },
    userId?: number // ✅ Optional, có thể null
) => {
    const column = await prisma.gradeColumn.findUnique({
        where: { id: data.grade_column_id },
    });
    if (!column) throw new ApiError(404, "Grade column not found");

    // ✅ Validate score
    if (data.score !== undefined) {
        if (data.score < 0 || data.score > column.maxScore) {
            throw new ApiError(
                400,
                `Score must be between 0 and ${column.maxScore}`
            );
        }
    }

    const isOverride = data.override_score !== undefined;

    return prisma.studentGrade.upsert({
        where: {
            studentId_gradeColumnId: {
                studentId: data.student_id,
                gradeColumnId: data.grade_column_id,
            },
        },
        update: {
            score: data.score,
            isAutoCalculated: false,
            isOverridden: isOverride,
            overriddenScore: data.override_score,
            overriddenBy: isOverride && userId ? userId : null, // ✅ Chỉ set nếu có userId
            overriddenAt: isOverride ?  new Date() : null,
            overrideReason: data. override_reason,
            note: data.note,
        },
        create: {
            studentId: data.student_id,
            gradeColumnId: data. grade_column_id,
            score: data.score || 0,
            maxScore: column. maxScore,
            isAutoCalculated: false,
            isOverridden: isOverride,
            overriddenScore: data. override_score,
            overriddenBy: isOverride && userId ? userId : null, // ✅ Chỉ set nếu có userId
            overriddenAt: isOverride ?  new Date() : null,
            overrideReason: data. override_reason,
            note: data.note,
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                            studentCode: true,
                        },
                    },
                },
            },
            gradeColumn: true,
        },
    });
};

export const bulkUpdateStudentGrades = async (
    data: {
        grade_column_id: number;
        grades: Array<{
            student_id: number;
            score?: number;
            override_score?: number;
            note?: string;
        }>;
        override_reason?: string;
    },
    userId?: number // ✅ Optional
) => {
    const column = await prisma.gradeColumn.findUnique({
        where: { id: data.grade_column_id },
    });
    if (!column) throw new ApiError(404, "Grade column not found");

    const operations = data.grades.map((grade) => {
        // ✅ Validate score
        if (grade.score !== undefined) {
            if (grade. score < 0 || grade. score > column.maxScore) {
                throw new ApiError(
                    400,
                    `Score must be between 0 and ${column.maxScore}`
                );
            }
        }

        const isOverride = grade.override_score !== undefined;

        return prisma.studentGrade.upsert({
            where: {
                studentId_gradeColumnId: {
                    studentId: grade.student_id,
                    gradeColumnId: data.grade_column_id,
                },
            },
            update: {
                score: grade. score,
                isAutoCalculated: false,
                isOverridden: isOverride,
                overriddenScore: grade.override_score,
                overriddenBy: isOverride && userId ?  userId : null, // ✅ Chỉ set nếu có userId
                overriddenAt: isOverride ? new Date() : null,
                overrideReason: data.override_reason,
                note: grade.note,
            },
            create: {
                studentId: grade.student_id,
                gradeColumnId: data.grade_column_id,
                score: grade.score || 0,
                maxScore: column.maxScore,
                isAutoCalculated: false,
                isOverridden: isOverride,
                overriddenScore: grade.override_score,
                overriddenBy: isOverride && userId ? userId : null, // ✅ Chỉ set nếu có userId
                overriddenAt: isOverride ? new Date() : null,
                overrideReason: data.override_reason,
                note: grade.note,
            },
        });
    });

    return prisma.$transaction(operations);
};

export const getStudentGradeReport = async (params: {
    student_id: number;
    section_id?: number;
    term_id?: number;
}) => {
    const where: any = {};

    if (params.section_id) {
        where.sectionId = params.section_id;
    }

    if (params.term_id) {
        where.termId = params.term_id;
    }

    // Lấy danh sách sections của sinh viên
    const enrollments = await prisma.sectionEnrollment.findMany({
        where: {
            studentId: params.student_id,
            section: where,
        },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                    gradeColumns: {
                        where: { isActive: true },
                        orderBy: { displayOrder: "asc" },
                        include: {
                            studentGrades: {
                                where: { studentId: params.student_id },
                            },
                        },
                    },
                },
            },
        },
    });

    return enrollments.map((enrollment) => ({
        section: {
            id: enrollment.section.id,
            code: enrollment.section.sectionCode,
            name: enrollment.section.sectionName,
        },
        subject: {
            code: enrollment.section.subject.subjectCode,
            name: enrollment.section.subject.subjectName,
            credits: enrollment.section.subject.credits,
        },
        term: enrollment.section.term
            ? {
                  code: enrollment.section.term.code,
                  name: enrollment.section.term.name,
              }
            : null,
        grades: enrollment.section.gradeColumns.map((col) => ({
            column: {
                id: col.id,
                name: col.name,
                type: col.type,
                weight: col.weight,
                maxScore: col.maxScore,
            },
            score: col.studentGrades[0]?.isOverridden
                ? col.studentGrades[0]?.overriddenScore
                : col.studentGrades[0]?.score,
            maxScore: col.studentGrades[0]?.maxScore || col.maxScore,
            isOverridden: col.studentGrades[0]?.isOverridden || false,
            note: col.studentGrades[0]?.note,
        })),
    }));
};

// Export điểm ra Excel/CSV
export const exportStudentGrades = async (params: {
    section_id: number;
    grade_column_id?: number;
}) => {
    const columns = await prisma.gradeColumn.findMany({
        where: {
            sectionId: params.section_id,
            id: params.grade_column_id,
            isActive: true,
        },
        orderBy: { displayOrder: "asc" },
    });

    const enrollments = await prisma.sectionEnrollment.findMany({
        where: {
            sectionId: params.section_id,
            status: "enrolled",
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            studentCode: true,
                            fullName: true,
                            email: true,
                        },
                    },
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

    const grades = await prisma.studentGrade.findMany({
        where: {
            gradeColumnId: {
                in: columns.map((c) => c.id),
            },
            studentId: {
                in: enrollments.map((e) => e.studentId),
            },
        },
    });

    // Format data cho export
    const data = enrollments.map((enrollment) => {
        const row: any = {
            student_code: enrollment.student.user.studentCode,
            full_name: enrollment.student.user.fullName,
            email: enrollment.student.user.email,
        };

        columns.forEach((col) => {
            const grade = grades.find(
                (g) =>
                    g.studentId === enrollment.studentId &&
                    g.gradeColumnId === col.id
            );
            row[col.name] = grade?.isOverridden
                ? grade.overriddenScore
                : grade?.score || 0;
        });

        return row;
    });

    return { columns, data };
};
