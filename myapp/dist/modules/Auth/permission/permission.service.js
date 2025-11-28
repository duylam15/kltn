"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPermission = createPermission;
exports.listPermissions = listPermissions;
exports.getPermissionById = getPermissionById;
exports.updatePermission = updatePermission;
exports.deletePermission = deletePermission;
const client_1 = require("../../../prisma/client");
// Tạo permission
async function createPermission(data) {
    return client_1.prisma.permission.create({ data });
}
// Lấy danh sách permission
async function listPermissions() {
    return client_1.prisma.permission.findMany({ orderBy: { createdAt: "desc" } });
}
// Lấy chi tiết permission
async function getPermissionById(id) {
    return client_1.prisma.permission.findUnique({ where: { id } });
}
// Cập nhật permission
async function updatePermission(id, data) {
    return client_1.prisma.permission.update({ where: { id }, data });
}
// Xoá permission
async function deletePermission(id) {
    return client_1.prisma.permission.delete({ where: { id } });
}
