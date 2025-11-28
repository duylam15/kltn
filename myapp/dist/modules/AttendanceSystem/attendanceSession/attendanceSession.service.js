"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.updateSession = exports.getSessionById = exports.getSessionsBySection = exports.createSession = void 0;
const client_1 = require("../../../prisma/client");
const createSession = async (data) => {
    const sessionCode = `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return client_1.prisma.attendanceSession.create({
        data: {
            sectionId: data.sectionId,
            sessionCode,
            expiresAt: data.expiresAt,
        },
    });
};
exports.createSession = createSession;
const getSessionsBySection = async (sectionId) => {
    return client_1.prisma.attendanceSession.findMany({
        where: { sectionId },
        include: { attendances: true },
        orderBy: { createdAt: "desc" },
    });
};
exports.getSessionsBySection = getSessionsBySection;
const getSessionById = async (id) => {
    return client_1.prisma.attendanceSession.findUnique({
        where: { id },
        include: {
            attendances: { include: { student: { include: { user: true } } } },
        },
    });
};
exports.getSessionById = getSessionById;
const updateSession = async (id, data) => {
    return client_1.prisma.attendanceSession.update({
        where: { id },
        data,
    });
};
exports.updateSession = updateSession;
const deleteSession = async (id) => {
    return client_1.prisma.attendanceSession.delete({ where: { id } });
};
exports.deleteSession = deleteSession;
