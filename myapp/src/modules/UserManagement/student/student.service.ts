import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";
import type { StudentStatus } from "@prisma/client";

// services/student.service.ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const getStudentByStudentCode = async (studentCode: string) => {
    return prisma.student.findUnique({
        where: { studentCode },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
};


export const createStudent = async (data: {
    studentCode: string;
    password: string;
    fullName: string;
    email?: string;
    className?: string;
    major?: string;
    academicYear?: string;
    enrollmentYear?: number;
}) => {
    // Validate input
    if (!data.studentCode) {
        throw new ApiError(400, "studentCode is required");
    }
    if (!data.password) {
        throw new ApiError(400, "password is required");
    }
    if (!data.fullName) {
        throw new ApiError(400, "fullName is required");
    }

    // Check trùng studentCode
    const existingStudent = await prisma.student.findFirst({
        where: { studentCode: data.studentCode },
    });
    if (existingStudent) {
        throw new ApiError(409, "Student code already exists");
    }

    // Check trùng email (nếu có)
    if (data.email) {
        const existingEmail = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingEmail) {
            throw new ApiError(409, "Email already exists");
        }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Tạo user + student
    const user = await prisma.user.create({
        data: {
            studentCode: data.studentCode, // nếu user có field này
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            role: {
                connect: { name: "student" }, // đảm bảo role "student" có sẵn
            },
            student: {
                create: {
                    studentCode: data.studentCode,
                    className: data.className,
                    major: data.major,
                    academicYear: data.academicYear,
                    enrollmentYear: data.enrollmentYear,
                },
            },
        },
        include: {
            student: true,
            role: true,
        },
    });

    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role?.name,
        student: user.student,
    };
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


export const updateStudent = (
    id: number,
    data: {
        className?: string;
        major?: string;
        academicYear?: string;
        enrollmentYear?: number;
        gpa?: number;
        status?: StudentStatus;
        fullName?: string;
        email?: string;
        phoneNumber?: string;
    }
) => {
    const { fullName, email, phoneNumber, ...studentData } = data;

    return prisma.student.update({
        where: { id },
        data: {
            ...studentData,
            user: {
                update: { fullName, email },
            },
        },
        include: { user: true },
    });
};

export const deleteStudent = (id: number) =>
    prisma.student.delete({ where: { id } });
