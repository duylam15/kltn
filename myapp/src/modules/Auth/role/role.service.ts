import { prisma } from "@/prisma/client";

export async function createRole(data: {
    name: string;
    description?: string;
    permissions?: number[]; // danh sách permissionId
}) {
    return prisma.role.create({
        data: {
            name: data.name,
            description: data.description,
            ...(data.permissions && {
                permissions: {
                    create: data.permissions.map((pid) => ({
                        permission: { connect: { id: pid } },
                    })),
                },
            }),
        },
        include: {
            permissions: { include: { permission: true } },
        },
    });
}

export async function updateRole(
    id: number,
    data: {
        name?: string;
        description?: string;
        permissions?: number[];
    }
) {
    // Kiểm tra tên có trùng không
    if (data.name) {
        const existing = await prisma.role.findUnique({
            where: { name: data.name },
        });
        if (existing && existing.id !== id) {
            throw new Error("Tên role đã tồn tại");
        }
    }

    // Cập nhật role cơ bản
    const role = await prisma.role.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
        },
    });

    // Nếu có permissions mới thì xử lý bảng RolePermission
    if (data.permissions) {
        // Xóa hết quyền cũ
        await prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });

        // Gán quyền mới
        await prisma.rolePermission.createMany({
            data: data.permissions.map((pid) => ({
                roleId: id,
                permissionId: pid,
            })),
        });
    }

    // Trả về role kèm permission mới
    return prisma.role.findUnique({
        where: { id },
        include: { permissions: { include: { permission: true } } },
    });
}



export async function getRoles() {
    return prisma.role.findMany({
        include: {
            permissions: { include: { permission: true } },
        },
    });
}

export async function getRoleById(id: number) {
    return prisma.role.findUnique({
        where: { id },
        include: {
            permissions: { include: { permission: true } },
        },
    });
}

export async function deleteRole(id: number) {
    return prisma.role.delete({ where: { id } });
}
