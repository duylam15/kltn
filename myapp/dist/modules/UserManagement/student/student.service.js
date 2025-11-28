"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.updateStudent = exports.getStudent = exports.listStudents = exports.createStudent = exports.getStudentByStudentCode = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
// services/student.service.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 10;
const getStudentByStudentCode = async (studentCode) => {
    return client_1.prisma.student.findUnique({
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
exports.getStudentByStudentCode = getStudentByStudentCode;
const createStudent = async (data) => {
    // Validate input
    if (!data.studentCode) {
        throw new ApiError_1.default(400, "studentCode is required");
    }
    if (!data.password) {
        throw new ApiError_1.default(400, "password is required");
    }
    if (!data.fullName) {
        throw new ApiError_1.default(400, "fullName is required");
    }
    // Check trùng studentCode
    const existingStudent = await client_1.prisma.student.findFirst({
        where: { studentCode: data.studentCode },
    });
    if (existingStudent) {
        throw new ApiError_1.default(409, "Student code already exists");
    }
    // Check trùng email (nếu có)
    if (data.email) {
        const existingEmail = await client_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingEmail) {
            throw new ApiError_1.default(409, "Email already exists");
        }
    }
    // Hash password
    const passwordHash = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
    // Tạo user + student
    const user = await client_1.prisma.user.create({
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
exports.createStudent = createStudent;
const listStudents = async (params) => {
    const where = {};
    if (params.status)
        where.status = params.status;
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
        client_1.prisma.student.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, fullName: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        client_1.prisma.student.count({ where }),
    ]);
    return { items, total };
};
exports.listStudents = listStudents;
const getStudent = (id) => client_1.prisma.student.findUnique({
    where: { id: id },
    include: {
        user: { select: { id: true, email: true, fullName: true } },
    },
});
exports.getStudent = getStudent;
const updateStudent = (id, data) => {
    const { fullName, email, phoneNumber, ...studentData } = data;
    return client_1.prisma.student.update({
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
exports.updateStudent = updateStudent;
const deleteStudent = (id) => client_1.prisma.student.delete({ where: { id } });
exports.deleteStudent = deleteStudent;
