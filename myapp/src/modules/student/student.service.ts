import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";

export const createStudent = async (data: {
    userId: number;
    studentCode: string;
    className?: string;
    major?: string;
    academicYear?: string;
    enrollmentYear?: number;
}) => {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new ApiError(400, "User not found");

    const existingProfile = await prisma.student.findUnique({
        where: { userId: data.userId },
    });
    if (existingProfile)
        throw new ApiError(409, "Student profile already exists");

    return prisma.student.create({
        data: {
            userId: data.userId,
            studentCode: data.studentCode,
            className: data.className,
            major: data.major,
            academicYear: data.academicYear,
            enrollmentYear: data.enrollmentYear,
        },
    });
};

export const listStudents = async (params: {
    page: number;
    limit: number;
    status?: string;
    className?: string;
    major?: string;
    q?: string;
}) => {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.className)
        where.className = { contains: params.className, mode: "insensitive" };
    if (params.major)
        where.major = { contains: params.major, mode: "insensitive" };
    if (params.q) {
        where.OR = [
            { studentCode: { contains: params.q, mode: "insensitive" } },
            { major: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.student.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, fullName: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.student.count({ where }),
    ]);

    return { items, total };
};

export const getStudent = (id: number) =>
    prisma.student.findUnique({
        where: { id: id },
        include: {
            user: { select: { id: true, email: true, fullName: true } },
        },
    });

import type { StudentStatus } from "@prisma/client";

export const updateStudent = (
    id: number,
    data: {
        className?: string;
        major?: string;
        academicYear?: string;
        enrollmentYear?: number;
        gpa?: number;
        status?: StudentStatus;
    }
) =>
    prisma.student.update({
        where: { id },
        data,
    });

export const deleteStudent = (id: number) =>
    prisma.student.delete({ where: { id } });
