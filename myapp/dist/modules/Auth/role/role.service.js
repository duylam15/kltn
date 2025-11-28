"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.getRoles = getRoles;
exports.getRoleById = getRoleById;
exports.deleteRole = deleteRole;
const client_1 = require("../../../prisma/client");
async function createRole(data) {
    return client_1.prisma.role.create({
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
async function updateRole(id, data) {
    // Kiểm tra tên có trùng không
    if (data.name) {
        const existing = await client_1.prisma.role.findUnique({
            where: { name: data.name },
        });
        if (existing && existing.id !== id) {
            throw new Error("Tên role đã tồn tại");
        }
    }
    // Cập nhật role cơ bản
    const role = await client_1.prisma.role.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
        },
    });
    // Nếu có permissions mới thì xử lý bảng RolePermission
    if (data.permissions) {
        // Xóa hết quyền cũ
        await client_1.prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });
        // Gán quyền mới
        await client_1.prisma.rolePermission.createMany({
            data: data.permissions.map((pid) => ({
                roleId: id,
                permissionId: pid,
            })),
        });
    }
    // Trả về role kèm permission mới
    return client_1.prisma.role.findUnique({
        where: { id },
        include: { permissions: { include: { permission: true } } },
    });
}
async function getRoles() {
    return client_1.prisma.role.findMany({
        include: {
            permissions: { include: { permission: true } },
        },
    });
}
async function getRoleById(id) {
    return client_1.prisma.role.findUnique({
        where: { id },
        include: {
            permissions: { include: { permission: true } },
        },
    });
}
async function deleteRole(id) {
    return client_1.prisma.role.delete({ where: { id } });
}
