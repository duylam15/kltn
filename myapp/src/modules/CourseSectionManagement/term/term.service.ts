import { prisma } from "@/prisma/client";
import ApiError from "@/utils/ApiError";

export const createTerm = async (data: {
    code: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
}) => {
    const existingTerm = await prisma.term.findUnique({
        where: { code: data.code },
    });
    if (existingTerm) throw new ApiError(409, "Term code already exists");

    return prisma.term.create({
        data: {
            code: data.code,
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    });
};

export const listTerms = async (params: {
    page: number;
    limit: number;
    q?: string;
}) => {
    const where: any = {};
    if (params.q) {
        where.OR = [
            { code: { contains: params.q, mode: "insensitive" } },
            { name: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.term.findMany({
            where,
            orderBy: { startDate: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.term.count({ where }),
    ]);

    return { items, total };
};

export const getTerm = (id: number) =>
    prisma.term.findUnique({
        where: { id },
        include: {
            courseSections: {
                include: {
                    subject: true,
                },
            },
        },
    });

export const updateTerm = (
    id: number,
    data: {
        code?: string;
        name?: string;
        startDate?: Date;
        endDate?: Date;
    }
) =>
    prisma.term.update({
        where: { id },
        data,
    });

export const deleteTerm = (id: number) => prisma.term.delete({ where: { id } });
