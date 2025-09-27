import { prisma } from "../../prisma/client";

export const createSession = async (data: {
    sectionId: number;
    expiresAt?: Date;
}) => {
    const sessionCode = `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return prisma.attendanceSession.create({
        data: {
            sectionId: data.sectionId,
            sessionCode,
            expiresAt: data.expiresAt,
        },
    });
};

export const getSessionsBySection = async (sectionId: number) => {
    return prisma.attendanceSession.findMany({
        where: { sectionId },
        include: { attendances: true },
        orderBy: { createdAt: "desc" },
    });
};

export const getSessionById = async (id: number) => {
    return prisma.attendanceSession.findUnique({
        where: { id },
        include: {
            attendances: { include: { student: { include: { user: true } } } },
        },
    });
};

export const updateSession = async (id: number, data: { expiresAt?: Date }) => {
    return prisma.attendanceSession.update({
        where: { id },
        data,
    });
};

export const deleteSession = async (id: number) => {
    return prisma.attendanceSession.delete({ where: { id } });
};
