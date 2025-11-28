"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.listUsers = exports.createUser = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const password_1 = require("../../../utils/password");
const createUser = async (data) => {
    const role = await client_1.prisma.role.findFirst({
        where: { name: data.roleName },
    });
    if (!role)
        throw new ApiError_1.default(400, "Role not found");
    const exists = await client_1.prisma.user.findUnique({
        where: { email: data.email },
    });
    if (exists)
        throw new ApiError_1.default(409, "Email already exists");
    const passwordHash = await (0, password_1.hashPassword)(data.password);
    return client_1.prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            fullName: data.fullName,
            roleId: role.id,
            avatarUrl: data.avatarUrl,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : undefined,
            address: data.address,
        },
    });
};
exports.createUser = createUser;
const listUsers = async (params) => {
    const where = {};
    if (params.role)
        where.role = { name: params.role };
    if (params.active === "true")
        where.isActive = true;
    if (params.active === "false")
        where.isActive = false;
    if (params.q) {
        where.OR = [
            { email: { contains: params.q, mode: "insensitive" } },
            { fullName: { contains: params.q, mode: "insensitive" } },
        ];
    }
    const [items, total] = await Promise.all([
        client_1.prisma.user.findMany({
            where,
            include: { role: true },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        client_1.prisma.user.count({ where }),
    ]);
    return { items, total };
};
exports.listUsers = listUsers;
const getUser = async (id) => {
    return client_1.prisma.user.findUnique({
        where: { id },
        include: { role: true, student: true, teacher: true },
    });
};
exports.getUser = getUser;
const updateUser = async (id, data) => {
    return client_1.prisma.user.update({
        where: { id },
        data: {
            email: data.email,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : undefined,
            address: data.address,
            isActive: data.isActive,
        },
    });
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    await client_1.prisma.user.delete({ where: { id } });
};
exports.deleteUser = deleteUser;
