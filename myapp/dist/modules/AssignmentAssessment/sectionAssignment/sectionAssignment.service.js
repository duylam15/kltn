"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssignmentVisibility = updateAssignmentVisibility;
exports.assignToSection = assignToSection;
exports.unassignFromSection = unassignFromSection;
exports.listBySection = listBySection;
exports.listByAssignment = listByAssignment;
const client_1 = require("../../../prisma/client");
async function updateAssignmentVisibility(sectionId, assignmentId, isOpen) {
    const updated = await client_1.prisma.sectionAssignment.update({
        where: {
            sectionId_assignmentId: {
                sectionId,
                assignmentId,
            },
        },
        data: {
            isOpen,
        },
        include: {
            assignment: true,
            section: true,
        },
    });
    return updated;
}
async function assignToSection(sectionId, assignmentId) {
    // Tạo assignment cho section
    const sectionAssignment = await client_1.prisma.sectionAssignment.create({
        data: { sectionId, assignmentId },
        include: {
            assignment: true,
            section: {
                include: {
                    subject: true,
                },
            },
        },
    });
    // Lấy danh sách sinh viên trong lớp
    const enrollments = await client_1.prisma.sectionEnrollment.findMany({
        where: {
            sectionId: sectionId,
            status: "enrolled", // chỉ lấy sinh viên đang enrolled
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    // Tạo thông báo cho tất cả sinh viên trong lớp
    if (enrollments.length > 0) {
        await client_1.prisma.notification.createMany({
            data: enrollments.map((enrollment) => ({
                userId: enrollment.student.userId,
                type: "assignment",
                title: `Bài tập mới: ${sectionAssignment.assignment.title}`,
                message: `Bạn có bài tập mới trong lớp ${sectionAssignment.section.subject.subjectName}`,
                assignmentId: assignmentId,
                sectionId: sectionId,
            })),
        });
    }
    return {
        sectionAssignment,
        studentsNotified: enrollments.map((e) => ({
            userId: e.student.userId,
            studentId: e.studentId,
            fullName: e.student.user.fullName,
        })),
    };
}
async function unassignFromSection(sectionId, assignmentId) {
    return client_1.prisma.sectionAssignment.delete({
        where: { sectionId_assignmentId: { sectionId, assignmentId } },
    });
}
async function listBySection(sectionId) {
    return client_1.prisma.sectionAssignment.findMany({
        where: { sectionId },
        include: { assignment: true },
    });
}
async function listByAssignment(assignmentId) {
    return client_1.prisma.sectionAssignment.findMany({
        where: { assignmentId },
        include: { section: true },
    });
}
