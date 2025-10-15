import { prisma } from "@/prisma/client";

// Tạo permission
export async function createPermission(data: {
    name: string;
    description?: string;
}) {
    return prisma.permission.create({ data });
}

// Lấy danh sách permission
export async function listPermissions() {
    return prisma.permission.findMany({ orderBy: { createdAt: "desc" } });
}

// Lấy chi tiết permission
export async function getPermissionById(id: number) {
    return prisma.permission.findUnique({ where: { id } });
}

// Cập nhật permission
export async function updatePermission(
    id: number,
    data: { name?: string; description?: string }
) {
    return prisma.permission.update({ where: { id }, data });
}

// Xoá permission
export async function deletePermission(id: number) {
    return prisma.permission.delete({ where: { id } });
}
