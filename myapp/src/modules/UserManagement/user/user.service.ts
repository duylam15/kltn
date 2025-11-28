import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";
import { hashPassword } from "../../../utils/password";

interface CreateUserInput {
    email: string;
    password: string;
    fullName: string;
    roleName: string;
    avatarUrl?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
}

export const createUser = async (data: CreateUserInput) => {
    const role = await prisma.role.findFirst({
        where: { name: data.roleName },
    });
    if (!role) throw new ApiError(400, "Role not found");

    const exists = await prisma.user.findUnique({
        where: { email: data.email },
    });
    if (exists) throw new ApiError(409, "Email already exists");

    const passwordHash = await hashPassword(data.password);

    return prisma.user.create({
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

export const listUsers = async (params: {
    page: number;
    limit: number;
    role?: string;
    active?: string;
    q?: string;
}) => {
    const where: any = {};
    if (params.role) where.role = { name: params.role };
    if (params.active === "true") where.isActive = true;
    if (params.active === "false") where.isActive = false;
    if (params.q) {
        where.OR = [
            { email: { contains: params.q, mode: "insensitive" } },
            { fullName: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: { role: true },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.user.count({ where }),
    ]);

    return { items, total };
};

export const getUser = async (id: number) => {
    return prisma.user.findUnique({
        where: { id },
        include: { role: true, student: true, teacher: true },
    });
};

export const updateUser = async (
    id: number,
    data: {
        email?: string;
        fullName?: string;
        avatarUrl?: string;
        phone?: string;
        dateOfBirth?: string;
        address?: string;
        isActive?: boolean;
    }
) => {
    return prisma.user.update({
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

export const deleteUser = async (id: number) => {
    await prisma.user.delete({ where: { id } });
};
