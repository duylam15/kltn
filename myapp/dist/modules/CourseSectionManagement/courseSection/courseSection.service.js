"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourseSection = exports.updateCourseSection = exports.getCourseSection = exports.listCourseSections = exports.createCourseSection = void 0;
const client_1 = require("../../../prisma/client");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const createCourseSection = async (data) => {
    const subject = await client_1.prisma.subject.findUnique({
        where: { id: data.subjectId },
    });
    if (!subject)
        throw new ApiError_1.default(400, "Subject not found");
    const term = await client_1.prisma.term.findUnique({ where: { id: data.termId } });
    if (!term)
        throw new ApiError_1.default(400, "Term not found");
    // Sử dụng transaction để đảm bảo tất cả được tạo cùng lúc
    return client_1.prisma.$transaction(async (tx) => {
        // 1. Tạo CourseSection
        const courseSection = await tx.courseSection.create({
            data: {
                subjectId: data.subjectId,
                termId: data.termId,
                sectionCode: data.sectionCode || "",
                sectionName: data.sectionName,
                schedule: data.schedule,
                maxStudents: Number(data.maxStudents) || 50,
                status: data.status || "planned",
            },
            include: {
                subject: true,
                term: true,
            },
        });
        // 2. Tự động tạo ChatRoom cho học phần
        await tx.chatRoom.create({
            data: {
                title: `Nhóm chat - ${data.sectionName}`,
                type: "section",
                sectionId: courseSection.id,
            },
        });
        // 3.  Tự động tạo 3 cột điểm mặc định
        const gradeColumns = [
            {
                name: "Điểm CC",
                type: "attendance_final",
                method: "auto_average",
                maxScore: 10.0,
                weight: 0.1,
                displayOrder: 1,
            },
            {
                name: "Điểm Đồ Án",
                type: "project",
                method: "auto_average",
                maxScore: 10.0,
                weight: 0.4,
                displayOrder: 2,
            },
            {
                name: "Điểm quá trình",
                type: "process",
                method: "weighted_average",
                maxScore: 10.0,
                weight: 0.5,
                displayOrder: 3,
            },
        ];
        // Tạo các cột điểm
        const createdColumns = await Promise.all(gradeColumns.map((column) => tx.gradeColumn.create({
            data: {
                sectionId: courseSection.id,
                name: column.name,
                type: column.type,
                method: column.method,
                maxScore: column.maxScore,
                weight: column.weight,
                displayOrder: column.displayOrder,
                isActive: true,
            },
        })));
        // 4. (Tùy chọn) Tạo quan hệ phụ thuộc cho cột "Điểm quá trình"
        // Cột "Điểm quá trình" phụ thuộc vào "Điểm CC" và "Điểm Đồ Án"
        const processColumn = createdColumns.find((col) => col.type === "process");
        const ccColumn = createdColumns.find((col) => col.type === "attendance_final");
        const projectColumn = createdColumns.find((col) => col.type === "project");
        if (processColumn && ccColumn && projectColumn) {
            await tx.gradeColumnDependency.createMany({
                data: [
                    {
                        dependentColumnId: processColumn.id,
                        sourceColumnId: ccColumn.id,
                        weight: 0.1, // Tỷ trọng của Điểm CC trong Điểm quá trình
                    },
                    {
                        dependentColumnId: processColumn.id,
                        sourceColumnId: projectColumn.id,
                        weight: 0.4, // Tỷ trọng của Điểm Đồ Án trong Điểm quá trình
                    },
                ],
            });
        }
        // 5. Trả về kết quả đầy đủ
        return {
            ...courseSection,
            gradeColumns: createdColumns,
        };
    });
};
exports.createCourseSection = createCourseSection;
const listCourseSections = async (params) => {
    const where = {};
    if (params.status)
        where.status = params.status;
    if (params.subjectId)
        where.subjectId = params.subjectId;
    if (params.termId)
        where.termId = params.termId;
    if (params.q) {
        where.OR = [
            { sectionCode: { contains: params.q, mode: "insensitive" } },
            {
                subject: {
                    subjectCode: { contains: params.q, mode: "insensitive" },
                },
            },
            {
                subject: {
                    subjectName: { contains: params.q, mode: "insensitive" },
                },
            },
        ];
    }
    const items = await client_1.prisma.courseSection.findMany({
        where,
        include: {
            subject: true,
            term: true,
            instructors: {
                include: {
                    teacher: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
            },
            _count: {
                select: {
                    instructors: true,
                    groups: true,
                    enrollments: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    return { items, total: items.length };
};
exports.listCourseSections = listCourseSections;
const getCourseSection = (id) => client_1.prisma.courseSection.findUnique({
    where: { id },
    include: {
        subject: true,
        term: true,
        instructors: {
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
        },
        groups: true,
        enrollments: {
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                fullName: true,
                            },
                        },
                    },
                },
            },
        },
    },
});
exports.getCourseSection = getCourseSection;
const updateCourseSection = (id, data) => client_1.prisma.courseSection.update({
    where: { id },
    data,
    include: {
        subject: true,
        term: true,
    },
});
exports.updateCourseSection = updateCourseSection;
const deleteCourseSection = (id) => client_1.prisma.courseSection.delete({ where: { id } });
exports.deleteCourseSection = deleteCourseSection;
