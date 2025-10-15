import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";

// Lấy danh sách nhóm còn slot trống của 1 section
export async function getAvailableGroups(sectionId: number, studentId: number) {
    // Kiểm tra xem sinh viên đã join nhóm nào chưa
    const existingEnrollment = await prisma.sectionEnrollment.findFirst({
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
    const groups = await prisma.sectionGroup.findMany({
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
export async function joinGroup(
    sectionId: number,
    groupId: number,
    studentId: number
) {
    // 1. Kiểm tra nhóm có tồn tại không
    const group = await prisma.sectionGroup.findFirst({
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
    const existingEnrollment = await prisma.sectionEnrollment.findFirst({
        where: { sectionId, studentId }
    });

    if (!existingEnrollment) {
        throw new Error("Student not enrolled in this section");
    }

    if (existingEnrollment.groupId) {
        throw new Error("Already joined a group");
    }

    // 4. Update enrollment với groupId
    const updated = await prisma.sectionEnrollment.update({
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
export async function leaveGroup(sectionId: number, studentId: number) {
    const enrollment = await prisma.sectionEnrollment.findFirst({
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
    const updated = await prisma.sectionEnrollment.update({
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
export async function getGroupMembers(sectionId: number, groupId: number) {
    const members = await prisma.sectionEnrollment.findMany({
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

export const createSectionGroup = async (data: {
    sectionId: number;
    groupCode?: string;
    groupName?: string;
    maxMembers?: number;
    isActive?: boolean;
}) => {
    const section = await prisma.courseSection.findUnique({
        where: { id: data.sectionId },
    });
    if (!section) throw new ApiError(400, "Course section not found");

    return prisma.sectionGroup.create({
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

export const listSectionGroups = async (params: {
    page: number;
    limit: number;
    sectionId?: number;
    isActive?: boolean;
    q?: string;
}) => {
    const where: any = {};
    if (params.sectionId) where.sectionId = params.sectionId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.q) {
        where.OR = [
            { groupCode: { contains: params.q, mode: "insensitive" } },
            { groupName: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.sectionGroup.findMany({
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
        prisma.sectionGroup.count({ where }),
    ]);

    return { items, total };
};

export const getSectionGroup = (id: number) =>
    prisma.sectionGroup.findUnique({
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

export const updateSectionGroup = (
    id: number,
    data: {
        groupCode?: string;
        groupName?: string;
        maxMembers?: number;
        isActive?: boolean;
    }
) =>
    prisma.sectionGroup.update({
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

export const deleteSectionGroup = (id: number) =>
    prisma.sectionGroup.delete({ where: { id } });

export async function listGroupsBySection(sectionId: number) {
    return prisma.sectionGroup.findMany({
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
