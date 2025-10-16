import { prisma } from "@/prisma/client";
import ApiError from "@/utils/ApiError";

export const createSubject = async (data: {
    subjectCode: string;
    subjectName: string;
    credits?: number;
    description?: string;
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
            // description: data.description || "",
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
            include: {
                chapters: {
                    orderBy: { order: "asc" },
                    include: {
                        _count: {
                            select: {
                                questions: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        chapters: true,
                        questions: true,
                    },
                },
            },
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
            chapters: {
                orderBy: { order: "asc" },
                include: {
                    _count: {
                        select: {
                            questions: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    chapters: true,
                    questions: true,
                    courseSections: true,
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
        description?: string;
    }
) =>
    prisma.subject.update({
        where: { id },
        data,
    });

export const deleteSubject = async (id: number) => {
    // Kiểm tra xem có chapters hoặc questions không
    const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    chapters: true,
                    questions: true,
                    courseSections: true,
                },
            },
        },
    });

    if (!subject) {
        throw new ApiError(404, "Subject not found");
    }

    if (subject._count.courseSections > 0) {
        throw new ApiError(
            400,
            `Cannot delete subject. It has ${subject._count.courseSections} course section(s).`
        );
    }

    if (subject._count.chapters > 0 || subject._count.questions > 0) {
        throw new ApiError(
            400,
            `Cannot delete subject. It has ${subject._count.chapters} chapter(s) and ${subject._count.questions} question(s).`
        );
    }

    return prisma.subject.delete({ where: { id } });
};
