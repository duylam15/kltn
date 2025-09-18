import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";
import type { InstructorRole } from "@prisma/client";

export const createSectionInstructor = async (data: {
    sectionId: number;
    teacherId: number;
    role?: InstructorRole;
}) => {
    const section = await prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section) throw new ApiError(400, "Course section not found");

    const teacher = await prisma.teacher.findUnique({
        where: { id: data.teacherId },
    });
    if (!teacher) throw new ApiError(400, "Teacher not found");

    const existingAssignment = await prisma.sectionInstructor.findUnique({
        where: {
            sectionId_teacherId: {
                sectionId: data.sectionId,
                teacherId: data.teacherId,
            },
        },
    });
    if (existingAssignment)
        throw new ApiError(409, "Teacher already assigned to this section");

    return prisma.sectionInstructor.create({
        data: {
            sectionId: data.sectionId,
            teacherId: data.teacherId,
            role: data.role || "owner",
        },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
            teacher: {
                include: {
                    user: { select: { id: true, email: true, fullName: true } },
                },
            },
        },
    });
};

export const listSectionInstructors = async (params: {
    page: number;
    limit: number;
    sectionId?: number;
    teacherId?: number;
    role?: InstructorRole;
}) => {
    const where: any = {};
    if (params.sectionId) where.sectionId = params.sectionId;
    if (params.teacherId) where.teacherId = params.teacherId;
    if (params.role) where.role = params.role;

    const [items, total] = await Promise.all([
        prisma.sectionInstructor.findMany({
            where,
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
                teacher: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true },
                        },
                    },
                },
            },
            orderBy: { assignedAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.sectionInstructor.count({ where }),
    ]);

    return { items, total };
};

export const getSectionInstructor = (sectionId: number, teacherId: number) =>
    prisma.sectionInstructor.findUnique({
        where: {
            sectionId_teacherId: {
                sectionId,
                teacherId,
            },
        },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
            teacher: {
                include: {
                    user: { select: { id: true, email: true, fullName: true } },
                },
            },
        },
    });

export const updateSectionInstructor = (
    sectionId: number,
    teacherId: number,
    data: {
        role?: InstructorRole;
    }
) =>
    prisma.sectionInstructor.update({
        where: {
            sectionId_teacherId: {
                sectionId,
                teacherId,
            },
        },
        data,
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
            teacher: {
                include: {
                    user: { select: { id: true, email: true, fullName: true } },
                },
            },
        },
    });

export const deleteSectionInstructor = (sectionId: number, teacherId: number) =>
    prisma.sectionInstructor.delete({
        where: {
            sectionId_teacherId: {
                sectionId,
                teacherId,
            },
        },
    });
