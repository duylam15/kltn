import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";

export const createSectionGroup = async (data: {
    sectionId: number;
    groupCode?: string;
    groupName?: string;
    maxMembers?: number;
    isActive?: boolean;
}) => {
    const section = await prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section) throw new ApiError(400, "Course section not found");

    return prisma.sectionGroup.create({
        data: {
            sectionId: data.sectionId,
            groupCode: data.groupCode,
            groupName: data.groupName,
            maxMembers: data.maxMembers || 6,
            isActive: data.isActive !== undefined ? data.isActive : true,
        },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
        },
    });
};

export const listSectionGroups = async (params: {
    page: number;
    limit: number;
    sectionId?: number;
    isActive?: boolean;
    q?: string;
}) => {
    const where: any = {};
    if (params.sectionId) where.sectionId = params.sectionId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.q) {
        where.OR = [
            { groupCode: { contains: params.q, mode: "insensitive" } },
            { groupName: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.sectionGroup.findMany({
            where,
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.sectionGroup.count({ where }),
    ]);

    return { items, total };
};

export const getSectionGroup = (id: number) =>
    prisma.sectionGroup.findUnique({
        where: { id },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
        },
    });

export const updateSectionGroup = (
    id: number,
    data: {
        groupCode?: string;
        groupName?: string;
        maxMembers?: number;
        isActive?: boolean;
    }
) =>
    prisma.sectionGroup.update({
        where: { id },
        data,
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
        },
    });

export const deleteSectionGroup = (id: number) =>
    prisma.sectionGroup.delete({ where: { id } });

export async function listGroupsBySection(sectionId: number) {
    return prisma.sectionGroup.findMany({
        where: { sectionId },
        include: {
            enrollments: {
                include: {
                    student: {
                        include: {
                            user: true, // 👈 để hiển thị thông tin user
                        },
                    },
                },
            },
        },
        orderBy: { id: "asc" },
    });
}
