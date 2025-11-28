"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSectionGroup = exports.updateSectionGroup = exports.getSectionGroup = exports.listSectionGroups = exports.createSectionGroup = void 0;
exports.getAvailableGroups = getAvailableGroups;
exports.joinGroup = joinGroup;
exports.leaveGroup = leaveGroup;
exports.getGroupMembers = getGroupMembers;
exports.listGroupsBySection = listGroupsBySection;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
// Lấy danh sách nhóm còn slot trống của 1 section
async function getAvailableGroups(sectionId, studentId) {
    // Kiểm tra xem sinh viên đã join nhóm nào chưa
    const existingEnrollment = await client_1.prisma.sectionEnrollment.findFirst({
        where: {
            sectionId,
            studentId,
            groupId: { not: null }
        },
        include: { group: true }
    });
    // Nếu đã join rồi thì trả về nhóm đó
    if (existingEnrollment && existingEnrollment.group) {
        return {
            joined: true,
            currentGroup: existingEnrollment.group
        };
    }
    // Lấy danh sách nhóm còn chỗ
    const groups = await client_1.prisma.sectionGroup.findMany({
        where: {
            sectionId,
            isActive: true
        },
        include: {
            _count: {
                select: { enrollments: true }
            }
        }
    });
    const availableGroups = groups
        .filter(g => g._count.enrollments < g.maxMembers)
        .map(g => ({
        ...g,
        currentMembers: g._count.enrollments,
        availableSlots: g.maxMembers - g._count.enrollments
    }));
    return {
        joined: false,
        availableGroups
    };
}
// Join nhóm
async function joinGroup(sectionId, groupId, studentId) {
    // 1. Kiểm tra nhóm có tồn tại không
    const group = await client_1.prisma.sectionGroup.findFirst({
        where: { id: groupId, sectionId, isActive: true },
        include: {
            _count: { select: { enrollments: true } }
        }
    });
    if (!group) {
        throw new Error("Group not found or inactive");
    }
    // 2. Kiểm tra còn slot không
    if (group._count.enrollments >= group.maxMembers) {
        throw new Error("Group is full");
    }
    // 3. Kiểm tra sinh viên đã join nhóm nào chưa
    const existingEnrollment = await client_1.prisma.sectionEnrollment.findFirst({
        where: { sectionId, studentId }
    });
    if (!existingEnrollment) {
        throw new Error("Student not enrolled in this section");
    }
    if (existingEnrollment.groupId) {
        throw new Error("Already joined a group");
    }
    // 4. Update enrollment với groupId
    const updated = await client_1.prisma.sectionEnrollment.update({
        where: { id: existingEnrollment.id },
        data: { groupId },
        include: {
            group: true,
            student: {
                include: { user: true }
            }
        }
    });
    return updated;
}
// Leave nhóm (optional)
// Leave nhóm
async function leaveGroup(sectionId, studentId) {
    const enrollment = await client_1.prisma.sectionEnrollment.findFirst({
        where: {
            sectionId,
            studentId,
            groupId: { not: null }
        },
        include: { group: true } // 👈 Include group để lấy thông tin
    });
    if (!enrollment) {
        throw new Error("Not in any group");
    }
    if (!enrollment.groupId) {
        throw new Error("Not in any group");
    }
    // 🔥 Lưu groupId trước khi update
    const groupId = enrollment.groupId;
    // Update enrollment, set groupId = null
    const updated = await client_1.prisma.sectionEnrollment.update({
        where: { id: enrollment.id },
        data: { groupId: null },
        include: {
            student: {
                include: { user: true }
            }
        }
    });
    // 🔥 Trả về cả groupId và updated enrollment
    return { ...updated, previousGroupId: groupId };
}
// Lấy danh sách sinh viên trong nhóm
async function getGroupMembers(sectionId, groupId) {
    const members = await client_1.prisma.sectionEnrollment.findMany({
        where: {
            sectionId,
            groupId,
            status: "enrolled"
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                            studentCode: true
                        }
                    }
                }
            }
        },
        orderBy: {
            enrolledAt: "asc"
        }
    });
    return members.map(m => ({
        enrollmentId: m.id,
        studentId: m.student.id,
        studentCode: m.student.studentCode,
        fullName: m.student.user.fullName,
        email: m.student.user.email,
        avatarUrl: m.student.user.avatarUrl,
        enrolledAt: m.enrolledAt
    }));
}
const createSectionGroup = async (data) => {
    const section = await client_1.prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section)
        throw new ApiError_1.default(400, "Course section not found");
    return client_1.prisma.sectionGroup.create({
        data: {
            sectionId: data.sectionId,
            groupCode: data.groupCode,
            groupName: data.groupName,
            maxMembers: data.maxMembers || 6,
            isActive: data.isActive !== undefined ? data.isActive : true,
        },
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
        },
    });
};
exports.createSectionGroup = createSectionGroup;
const listSectionGroups = async (params) => {
    const where = {};
    if (params.sectionId)
        where.sectionId = params.sectionId;
    if (params.isActive !== undefined)
        where.isActive = params.isActive;
    if (params.q) {
        where.OR = [
            { groupCode: { contains: params.q, mode: "insensitive" } },
            { groupName: { contains: params.q, mode: "insensitive" } },
        ];
    }
    const [items, total] = await Promise.all([
        client_1.prisma.sectionGroup.findMany({
            where,
            include: {
                section: {
                    include: {
                        subject: true,
                        term: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        client_1.prisma.sectionGroup.count({ where }),
    ]);
    return { items, total };
};
exports.listSectionGroups = listSectionGroups;
const getSectionGroup = (id) => client_1.prisma.sectionGroup.findUnique({
    where: { id },
    include: {
        section: {
            include: {
                subject: true,
                term: true,
            },
        },
    },
});
exports.getSectionGroup = getSectionGroup;
const updateSectionGroup = (id, data) => client_1.prisma.sectionGroup.update({
    where: { id },
    data,
    include: {
        section: {
            include: {
                subject: true,
                term: true,
            },
        },
    },
});
exports.updateSectionGroup = updateSectionGroup;
const deleteSectionGroup = (id) => client_1.prisma.sectionGroup.delete({ where: { id } });
exports.deleteSectionGroup = deleteSectionGroup;
async function listGroupsBySection(sectionId) {
    return client_1.prisma.sectionGroup.findMany({
        where: { sectionId },
        include: {
            enrollments: {
                include: {
                    student: {
                        include: {
                            user: true, // 👈 để hiển thị thông tin user
                        },
                    },
                },
            },
        },
        orderBy: { id: "asc" },
    });
}
