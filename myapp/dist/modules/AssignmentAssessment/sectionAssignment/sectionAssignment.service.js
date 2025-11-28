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
    return client_1.prisma.sectionAssignment.create({
        data: { sectionId, assignmentId },
        include: { assignment: true },
    });
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
