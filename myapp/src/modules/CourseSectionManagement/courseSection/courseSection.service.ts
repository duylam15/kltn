import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";
import type { CourseSectionStatus } from "@prisma/client";

export const createCourseSection = async (data: {
    subjectId: number;
    termId: number;
    sectionCode?: string;
    sectionName: string;
    schedule?: any;
    maxStudents?: number;
    status?: CourseSectionStatus;
}) => {
    const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject) throw new ApiError(400, "Subject not found");

    const term = await prisma.term.findUnique({ where: { id: data.termId } });
    if (!term) throw new ApiError(400, "Term not found");

    return prisma.courseSection.create({
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
