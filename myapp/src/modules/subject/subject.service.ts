import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";

export const createSubject = async (data: {
    subjectCode: string;
    subjectName: string;
    credits?: number;
}) => {
    const existingSubject = await prisma.subject.findUnique({
        where: { subjectCode: data.subjectCode },
    });
    if (existingSubject) throw new ApiError(409, "Subject code already exists");

    return prisma.subject.create({
        data: {
            subjectCode: data.subjectCode,
            subjectName: data.subjectName,
            credits: data.credits || 3,
        },
    });
};

export const listSubjects = async (params: {
    page: number;
    limit: number;
    q?: string;
}) => {
    const where: any = {};
    if (params.q) {
        where.OR = [
            { subjectCode: { contains: params.q, mode: "insensitive" } },
            { subjectName: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.subject.findMany({
            where,
            orderBy: { subjectCode: "asc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.subject.count({ where }),
    ]);

    return { items, total };
};

export const getSubject = (id: number) =>
    prisma.subject.findUnique({
        where: { id },
        include: {
            courseSections: {
                include: {
                    term: true,
                },
            },
        },
    });

export const updateSubject = (
    id: number,
    data: {
        subjectCode?: string;
        subjectName?: string;
        credits?: number;
    }
) =>
    prisma.subject.update({
        where: { id },
        data,
    });

export const deleteSubject = (id: number) =>
    prisma.subject.delete({ where: { id } });
