import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";
import type { CourseSectionStatus, GradeCalculationMethod, GradeColumnType } from "@prisma/client";

export const createCourseSection = async (data: {
    subjectId: number;
    termId: number;
    sectionCode?: string;
    sectionName: string;
    schedule?: any;
    maxStudents?: number;
    status?: CourseSectionStatus;
}) => {
    console.log("📥 [Input] createCourseSection data:", data);

    const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject) throw new ApiError(400, "Subject not found");

    const term = await prisma.term.findUnique({ where: { id: data.termId } });
    if (!term) throw new ApiError(400, "Term not found");

    return prisma.$transaction(async (tx) => {
        try {
            console.log("📌 [1] Tạo CourseSection...");
            const courseSection = await tx.courseSection.create({
                data: {
                    subjectId: data.subjectId,
                    termId: data.termId,
                    sectionCode: data.sectionCode || "",
                    sectionName: data.sectionName,
                    schedule: data.schedule,
                    maxStudents: Number(data.maxStudents) || 50,
                    status: data.status || "planned",
                },
                include: {
                    subject: true,
                    term: true,
                },
            });
            console.log("✅ [1] CourseSection:", courseSection);

            console.log("📌 [2] Tạo ChatRoom...");
            await tx.chatRoom.create({
                data: {
                    title: `Nhóm chat - ${data.sectionName}`,
                    type: "section",
                    sectionId: courseSection.id,
                },
            });
            console.log("✅ [2] Tạo ChatRoom OK");

            console.log("📌 [3] Tạo gradeColumns mặc định...");
            const gradeColumns = [
                {
                    name: "Điểm CC",
                    type: "attendance_final",
                    method: "auto_average",
                    maxScore: 10.0,
                    weight: 0.1,
                    displayOrder: 1,
                },
                {
                    name: "Điểm Đồ Án",
                    type: "project",
                    method: "auto_average",
                    maxScore: 10.0,
                    weight: 0.4,
                    displayOrder: 2,
                },
                {
                    name: "Điểm quá trình",
                    type: "process",
                    method: "weighted_average",
                    maxScore: 10.0,
                    weight: 0.5,
                    displayOrder: 3,
                },
            ];

            const createdColumns = await Promise.all(
                gradeColumns.map((column) => {
                    console.log("➡️ Tạo Column:", column);
                    return tx.gradeColumn.create({
                        data: {
                            sectionId: courseSection.id,
                            name: column.name,
                            type: column.type as GradeColumnType,
                            method: column.method as GradeCalculationMethod,
                            maxScore: column.maxScore,
                            weight: column.weight,
                            displayOrder: column.displayOrder,
                            isActive: true,
                        },
                    });
                })
            );

            console.log("✅ [3] createdColumns:", createdColumns);

            console.log("📌 [4] Tạo dependency...");
            const processColumn = createdColumns.find(
                (col) => col.type === "process"
            );
            const ccColumn = createdColumns.find(
                (col) => col.type === "attendance_final"
            );
            const projectColumn = createdColumns.find(
                (col) => col.type === "project"
            );

            console.log("🧩 processColumn:", processColumn);
            console.log("🧩 ccColumn:", ccColumn);
            console.log("🧩 projectColumn:", projectColumn);

            if (processColumn && ccColumn && projectColumn) {
                await tx.gradeColumnDependency.createMany({
                    data: [
                        {
                            dependentColumnId: processColumn.id,
                            sourceColumnId: ccColumn.id,
                            weight: 0.1,
                        },
                        {
                            dependentColumnId: processColumn.id,
                            sourceColumnId: projectColumn.id,
                            weight: 0.4,
                        },
                    ],
                });
                console.log("✅ [4] Dependency OK");
            } else {
                console.log("⚠️ [4] SKIP dependency do thiếu cột");
            }

            console.log("📤 [5] Return section + columns");
            return {
                ...courseSection,
                gradeColumns: createdColumns,
            };
        } catch (err: any) {
            console.log("❌ LỖI TRONG TRANSACTION createCourseSection");
            console.log("📛 ERROR:", err);
            throw err;
        }
    });
};


export const listCourseSections = async (params: {
    status?: CourseSectionStatus;
    subjectId?: number;
    termId?: number;
    q?: string;
}) => {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.subjectId) where.subjectId = params.subjectId;
    if (params.termId) where.termId = params.termId;
    if (params.q) {
        where.OR = [
            { sectionCode: { contains: params.q, mode: "insensitive" } },
            {
                subject: {
                    subjectCode: { contains: params.q, mode: "insensitive" },
                },
            },
            {
                subject: {
                    subjectName: { contains: params.q, mode: "insensitive" },
                },
            },
        ];
    }

    const items = await prisma.courseSection.findMany({
        where,
        include: {
            subject: true,
            term: true,
            instructors: {
                include: {
                    teacher: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
            },
            _count: {
                select: {
                    instructors: true,
                    groups: true,
                    enrollments: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return { items, total: items.length };
};

export const getCourseSection = (id: number) =>
    prisma.courseSection.findUnique({
        where: { id },
        include: {
            subject: true,
            term: true,
            instructors: {
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
            },
            groups: true,
            enrollments: {
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

export const updateCourseSection = (
    id: number,
    data: {
        schedule?: any;
        maxStudents?: number;
        currentStudents?: number;
        status?: CourseSectionStatus;
    }
) =>
    prisma.courseSection.update({
        where: { id },
        data,
        include: {
            subject: true,
            term: true,
        },
    });

export const deleteCourseSection = (id: number) =>
    prisma.courseSection.delete({ where: { id } });
