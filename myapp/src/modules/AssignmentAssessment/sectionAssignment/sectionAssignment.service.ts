import { prisma } from "../../../prisma/client";

export async function updateAssignmentVisibility(
    sectionId: number,
    assignmentId: number,
    isOpen: boolean
) {
    const updated = await prisma.sectionAssignment.update({
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

export async function assignToSection(sectionId: number, assignmentId: number) {
    // Tạo assignment cho section
    const sectionAssignment = await prisma.sectionAssignment.create({
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
    const enrollments = await prisma.sectionEnrollment.findMany({
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
        await prisma.notification.createMany({
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


export async function unassignFromSection(
    sectionId: number,
    assignmentId: number
) {
    return prisma.sectionAssignment.delete({
        where: { sectionId_assignmentId: { sectionId, assignmentId } },
    });
}

export async function listBySection(sectionId: number) {
    return prisma.sectionAssignment.findMany({
        where: { sectionId },
        include: { assignment: true },
    });
}

export async function listByAssignment(assignmentId: number) {
    return prisma.sectionAssignment.findMany({
        where: { assignmentId },
        include: { section: true },
    });
}
