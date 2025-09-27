import { prisma } from "../../prisma/client";
import ApiError from "../../utils/ApiError";
import { Prisma } from "@prisma/client";

type Params = {
    teacherId: number;
    userId?: number;
    termId?: number;
    status?: "planned" | "ongoing" | "completed" | "cancelled";
    activeOnly?: boolean;
    q?: string;
    page: number;
    pageSize: number;
};

export async function listTeacherGroups(params: Params) {
    const { teacherId, userId, termId, status, activeOnly, q, page, pageSize } =
        params;

    // Map userId -> teacherId
    let effTeacherId = teacherId;
    if (userId) {
        const t = await prisma.teacher.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!t) throw new ApiError(404, "Teacher not found with given userId");
        effTeacherId = t.id;
    }

    // WHERE cho CourseSection
    const sectionWhere: Prisma.CourseSectionWhereInput = {
        instructors: { some: { teacherId: effTeacherId } },
        ...(termId ? { termId } : {}),
        ...(status ? { status } : {}),
        ...(q
            ? {
                  OR: [
                      { sectionCode: { contains: q, mode: "insensitive" } },
                      {
                          subject: {
                              subjectName: { contains: q, mode: "insensitive" },
                          },
                      },
                      {
                          groups: {
                              some: {
                                  groupName: {
                                      contains: q,
                                      mode: "insensitive",
                                  },
                              },
                          },
                      },
                  ],
              }
            : {}),
    };

    const groupWhere: Prisma.SectionGroupWhereInput = activeOnly
        ? { isActive: true }
        : {};

    // Query trực tiếp subject → include nhiều section
    const subjects = await prisma.subject.findMany({
        where: {
            courseSections: { some: sectionWhere }, // ✅ đúng field
        },
        orderBy: { id: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
            courseSections: {
                // ✅ đúng field
                where: sectionWhere,
                orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
                include: {
                    term: true,
                    instructors: {
                        where: { teacherId: effTeacherId },
                        include: { teacher: { include: { user: true } } },
                    },
                    groups: {
                        where: groupWhere,
                        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
                        include: { _count: { select: { enrollments: true } } },
                    },
                    _count: { select: { enrollments: true, groups: true } },
                },
            },
        },
    });


    const data = subjects.map((subj) => ({
        subjectId: subj.id,
        subjectCode: subj.subjectCode,
        subjectName: subj.subjectName,
        credits: subj.credits,
        sections: subj.courseSections.map((s) => ({
            sectionId: s.id,
            sectionCode: s.sectionCode,
            sectionName: s.sectionName,
            status: s.status,
            term: s.term
                ? { id: s.termId, code: s.term.code, name: s.term.name }
                : null,
            stats: {
                groups: s._count.groups,
                enrollments: s._count.enrollments,
            },
            groups: s.groups.map((g) => ({
                groupId: g.id,
                groupCode: g.groupCode,
                groupName: g.groupName,
                isActive: g.isActive,
                maxMembers: g.maxMembers,
                memberCount: g._count.enrollments,
                createdAt: g.createdAt,
                updatedAt: g.updatedAt,
            })),
            instructors: s.instructors.map((i) => ({
                teacherId: i.teacherId,
                role: i.role,
                assignedAt: i.assignedAt,
                teacherName: i.teacher.user.fullName,
                teacherCode: i.teacher.teacherCode,
            })),
            updatedAt: s.updatedAt,
            createdAt: s.createdAt,
        })),
    }));


    // Đếm tổng số subject thỏa điều kiện
    const total = await prisma.subject.count({
        where: {
            courseSections: { some: sectionWhere }, // ✅ đúng field
        },
    });

    return { data, page, pageSize, total };
}




export const createTeacher = async (data: {
    user_id: number;
    teacher_code: string;
    department?: string;
    position?: string;
    specialization?: string;
}) => {
    const user = await prisma.user.findUnique({
        where: { id: data.user_id },
    });
    if (!user) throw new ApiError(400, "User not found");

    const existingProfile = await prisma.teacher.findUnique({
        where: { id: data.user_id },
    });
    if (existingProfile)
        throw new ApiError(409, "Teacher profile already exists for this user");

    const teacher = await prisma.teacher.create({
        data: {
            userId: data.user_id,
            teacherCode: data.teacher_code,
            department: data.department,
            position: data.position,
            specialization: data.specialization,
        },
    });
    return teacher;
};

export const listTeachers = async (params: {
    page: number;
    limit: number;
    department?: string;
    position?: string;
    q?: string;
}) => {
    const where: any = {};
    if (params.department)
        where.department = { contains: params.department, mode: "insensitive" };
    if (params.position)
        where.position = { contains: params.position, mode: "insensitive" };
    if (params.q) {
        where.OR = [
            { teacher_code: { contains: params.q, mode: "insensitive" } },
            { specialization: { contains: params.q, mode: "insensitive" } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.teacher.findMany({
            where,
            include: {
                user: {
                    select: { id: true, email: true, fullName: true },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (params.page - 1) * params.limit,
            take: params.limit,
        }),
        prisma.teacher.count({ where }),
    ]);

    return { items, total };
};

export const getTeacher = async (id: number) => {
    return prisma.teacher.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, email: true, fullName: true },
            },
        },
    });
};

export const updateTeacher = async (
    id: number,
    data: {
        department?: string;
        position?: string;
        specialization?: string;
    }
) => {
    return prisma.teacher.update({
        where: { id },
        data,
    });
};

export const deleteTeacher = async (id: number) => {
    await prisma.teacher.delete({ where: { id } });
};
