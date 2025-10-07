import { prisma } from "../../prisma/client";
import { GradeColumnType, AttendanceScoreMethod, AssignmentScoreMethod } from "@prisma/client";

interface CreateTemplateData {
    name: string;
    description?: string;
    subjectCode?: string;
    department?: string;
    isPublic?: boolean;
    createdBy: number;
    columns: Array<{
        name: string;
        type: GradeColumnType;
        weight: number;
        maxScore: number;
        order: number;
        isVisible?: boolean;
        isEditable?: boolean;
        isAutoCalculated?: boolean;
        autoUpdate?: boolean;
        attendanceScoreMethod?: AttendanceScoreMethod;
        attendanceConfig?: any;
        assignmentScoreMethod?: AssignmentScoreMethod;
        assignmentConfig?: any;
        description?: string;
    }>;
    formula?: {
        formula: any;
        gradeScale?: any;
        passingScore?: number;
    };
}

export async function createTemplate(data: CreateTemplateData) {
    return prisma.gradeTemplate.create({
        data: {
            name: data.name,
            description: data.description,
            subjectCode: data.subjectCode,
            department: data.department,
            isPublic: data.isPublic ?? false,
            createdBy: data.createdBy,

            columns: {
                create: data.columns.map((c) => ({
                    name: c.name,
                    type: c.type,
                    weight: c.weight,
                    maxScore: c.maxScore,
                    order: c.order,
                    isVisible: c.isVisible,
                    isEditable: c.isEditable,
                    isAutoCalculated: c.isAutoCalculated,
                    autoUpdate: c.autoUpdate,
                    attendanceScoreMethod: c.attendanceScoreMethod,
                    attendanceConfig: c.attendanceConfig,
                    assignmentScoreMethod: c.assignmentScoreMethod,
                    assignmentConfig: c.assignmentConfig,
                    description: c.description,
                })),
            },

            formula: data.formula
                ? {
                      create: {
                          formula: data.formula.formula,
                          gradeScale: data.formula.gradeScale,
                          passingScore: data.formula.passingScore,
                      },
                  }
                : undefined,
        },
        include: {
            columns: { orderBy: { order: "asc" } },
            formula: true,
        },
    });
}


export async function listTemplates(filters: {
    subjectCode?: string;
    department?: string;
    isPublic?: boolean;
    isActive?: boolean;
}) {
    return prisma.gradeTemplate.findMany({
        where: {
            subjectCode: filters.subjectCode,
            department: filters.department,
            isPublic: filters.isPublic,
            isActive: filters.isActive,
        },
        include: {
            columns: {
                orderBy: { order: "asc" },
            },
            formula: true,
            _count: {
                select: { usedBy: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getTemplateById(id: number) {
    return prisma.gradeTemplate.findUnique({
        where: { id },
        include: {
            columns: {
                orderBy: { order: "asc" },
            },
            formula: true,
            usedBy: {
                select: {
                    id: true,
                    sectionCode: true,
                    sectionName: true,
                },
            },
        },
    });
}

export async function updateTemplate(
    id: number,
    data: Partial<CreateTemplateData>
) {
    // Cập nhật template
    const updateData: any = {
        name: data.name,
        description: data.description,
        subjectCode: data.subjectCode,
        department: data.department,
        isPublic: data.isPublic,
    };

    // Nếu có columns, xóa cũ và tạo mới
    if (data.columns) {
        await prisma.gradeTemplateColumn.deleteMany({
            where: { templateId: id },
        });
        updateData.columns = {
            create: data.columns,
        };
    }

    // Nếu có formula, update hoặc create
    if (data.formula) {
        const existingFormula = await prisma.gradeTemplateFormula.findUnique({
            where: { templateId: id },
        });

        if (existingFormula) {
            await prisma.gradeTemplateFormula.update({
                where: { templateId: id },
                data: data.formula,
            });
        } else {
            updateData.formula = {
                create: data.formula,
            };
        }
    }

    return prisma.gradeTemplate.update({
        where: { id },
        data: updateData,
        include: {
            columns: {
                orderBy: { order: "asc" },
            },
            formula: true,
        },
    });
}

export async function deleteTemplate(id: number) {
    // Check if template is being used
    const template = await prisma.gradeTemplate.findUnique({
        where: { id },
        include: {
            _count: {
                select: { usedBy: true },
            },
        },
    });

    if (template?._count?.usedBy && template._count.usedBy > 0) {
        throw new Error(
            "Cannot delete template that is being used by sections"
        );
    }

    return prisma.gradeTemplate.delete({
        where: { id },
    });
}

export async function applyTemplateToSection(
    templateId: number,
    sectionId: number
) {
    const template = await prisma.gradeTemplate.findUnique({
        where: { id: templateId },
        include: {
            columns: {
                orderBy: { order: "asc" },
            },
            formula: true,
        },
    });

    if (!template) {
        throw new Error("Template not found");
    }

    // Update section với templateId
    await prisma.courseSection.update({
        where: { id: sectionId },
        data: { gradeTemplateId: templateId },
    });

    // Copy columns từ template sang section
    const gradeColumns = await prisma.gradeColumn.createMany({
        data: template.columns.map((col) => ({
            sectionId,
            name: col.name,
            type: col.type,
            weight: col.weight,
            maxScore: col.maxScore,
            order: col.order,
            isVisible: col.isVisible,
            isEditable: col.isEditable,
            isAutoCalculated: col.isAutoCalculated,
            autoUpdate: col.autoUpdate,
            attendanceScoreMethod: col.attendanceScoreMethod,
            attendanceConfig: col.attendanceConfig as any,
            assignmentScoreMethod: col.assignmentScoreMethod,
            assignmentConfig: col.assignmentConfig as any,
            description: col.description,
        })),
    });

    // Copy formula nếu có
    if (template.formula) {
        await prisma.gradeFormula.upsert({
            where: { sectionId },
            create: {
                sectionId,
                formula: template.formula.formula as any,
                gradeScale: template.formula.gradeScale as any,
                passingScore: template.formula.passingScore,
            },
            update: {
                formula: template.formula.formula as any,
                gradeScale: template.formula.gradeScale as any,
                passingScore: template.formula.passingScore,
            },
        });
    }

    return {
        template,
        gradeColumns,
    };
}
