import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";

export const createTeacher = async (data: {
    user_id: number;
    teacher_code: string;
    department?: string;
    position?: string;
    specialization?: string;
}) => {
    const user = await prisma.user.findUnique({
        where: { id: data.user_id },
    });
    if (!user) throw new ApiError(400, "User not found");

    const existingProfile = await prisma.teacher.findUnique({
        where: { id: data.user_id },
    });
    if (existingProfile)
        throw new ApiError(409, "Teacher profile already exists for this user");

    const teacher = await prisma.teacher.create({
        data: {
            userId: data.user_id,
            teacherCode: data.teacher_code,
            department: data.department,
            position: data.position,
            specialization: data.specialization,
        },
    });
    return teacher;
};

export const listTeachers = async (params: {
    page: number;
    limit: number;
    department?: string;
    position?: string;
    q?: string;
}) => {
    const where: any = {};
    if (params.department)
        where.department = { contains: params.department, mode: "insensitive" };
    if (params.position)
        where.position = { contains: params.position, mode: "insensitive" };
    if (params.q) {
        where.OR = [
            { teacher_code: { contains: params.q, mode: "insensitive" } },
            { specialization: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.teacher.findMany({
            where,
            include: {
                user: {
                    select: { id: true, email: true, fullName: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.teacher.count({ where }),
    ]);

    return { items, total };
};

export const getTeacher = async (id: number) => {
    return prisma.teacher.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, email: true, fullName: true },
            },
        },
    });
};

export const updateTeacher = async (
    id: number,
    data: {
        department?: string;
        position?: string;
        specialization?: string;
    }
) => {
    return prisma.teacher.update({
        where: { id },
        data,
    });
};

export const deleteTeacher = async (id: number) => {
    await prisma.teacher.delete({ where: { id } });
};
