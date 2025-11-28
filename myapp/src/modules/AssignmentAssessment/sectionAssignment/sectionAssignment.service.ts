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
    return prisma.sectionAssignment.create({
        data: { sectionId, assignmentId },
        include: { assignment: true },
    });
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
