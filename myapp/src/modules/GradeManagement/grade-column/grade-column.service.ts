import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";
import { GradeColumnType, GradeCalculationMethod } from "@prisma/client";

// grade-column.service.ts
export const createGradeColumn = async (data: {
  section_id: number;
  name: string;
  type: GradeColumnType;
  method?: GradeCalculationMethod; // ✅ Optional
  max_score?: number;
  weight?: number;
  display_order?: number;
  is_active?: boolean;
  attendance_sessions?: Array<{
    attendance_session_id: number;
    weight: number;
    max_score?: number;
  }>;
  assignments?: Array<{
    assignment_id: number;
    weight: number;
    max_score?: number;
  }>;
  dependencies?: Array<{
    source_column_id: number;
    weight: number;
  }>;
}) => {
  // ✅ Tự động set method = weighted_average nếu type = process
  let finalMethod = data.method;
  if (data.type === 'process') {
    finalMethod = 'weighted_average';
  }

  // ✅ Validation cho process
  if (data.type === 'process') {
    if (! data.dependencies || data.dependencies.length === 0) {
      throw new ApiError(400, "Process grade column requires at least one dependency");
    }
    if (! data.weight || data.weight <= 0) {
      throw new ApiError(400, "Process grade column requires a valid weight (coefficient)");
    }
  }

  return prisma.gradeColumn.create({
    data: {
      sectionId: data.section_id,
      name: data.name,
      type: data.type,
      method: finalMethod || 'auto_average',
      maxScore: data. max_score || 10,
      weight: data.weight || 0,
      displayOrder: data.display_order || 0,
      isActive: data.is_active ??  true,
      
      attendanceSessions: data. attendance_sessions ?  {
        create: data.attendance_sessions.map(s => ({
          attendanceSessionId: s.attendance_session_id,
          weight: s.weight,
          maxScore: s.max_score,
        })),
      } : undefined,
      
      assignments: data.assignments ?  {
        create: data.assignments.map(a => ({
          assignmentId: a.assignment_id,
          weight: a. weight,
          maxScore: a.max_score,
        })),
      } : undefined,
      
      dependentColumns: data.dependencies ? {
        create: data.dependencies. map(d => ({
          sourceColumnId: d.source_column_id,
          weight: d.weight,
        })),
      } : undefined,
    },
    include: {
      attendanceSessions: {
        include: {
          attendanceSession: true,
        },
      },
      assignments: {
        include: {
          assignment: true,
        },
      },
      dependentColumns: {
        include: {
          sourceColumn: true,
        },
      },
    },
  });
};
export const listGradeColumns = async (params: {
    section_id: number;
    type?: GradeColumnType;
    is_active?: boolean;
    page: number;
    limit: number;
}) => {
    const where: any = {
        sectionId: params. section_id,
    };
    
    if (params.type) where.type = params.type;
    if (params.is_active !== undefined) where.isActive = params.is_active;

    const [items, total] = await Promise.all([
        prisma. gradeColumn.findMany({
            where,
            orderBy: { displayOrder: "asc" },
            skip: (params. page - 1) * params. limit,
            take: params. limit,
            include: {
                attendanceSessions: {
                    include: {
                        attendanceSession: {
                            select: {
                                id: true,
                                name: true,
                                sessionScore: true,
                            },
                        },
                    },
                },
                assignments: {
                    include: {
                        assignment: {
                            select: {
                                id: true,
                                title: true,
                                maxScore: true,
                                type: true,
                            },
                        },
                    },
                },
                dependentColumns: {
                    include: {
                        sourceColumn: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.gradeColumn.count({ where }),
    ]);

    return { items, total };
};

export const getGradeColumn = (id: number) =>
    prisma.gradeColumn.findUnique({
        where: { id },
        include: {
            section: {
                select: {
                    id: true,
                    sectionCode: true,
                    sectionName: true,
                    subject: {
                        select: {
                            subjectCode: true,
                            subjectName: true,
                        },
                    },
                },
            },
            attendanceSessions: {
                include: {
                    attendanceSession: true,
                },
            },
            assignments: {
                include: {
                    assignment: true,
                },
            },
            dependentColumns: {
                include: {
                    sourceColumn: true,
                },
            },
            sourceForColumns: {
                include: {
                    dependentColumn: true,
                },
            },
            studentGrades: {
                take: 5, // Preview 5 sinh viên
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    fullName: true,
                                    studentCode: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

export const updateGradeColumn = async (
    id: number,
    data: {
        name?: string;
        method?: GradeCalculationMethod;
        max_score?: number;
        weight?: number;
        display_order?: number;
        is_active?: boolean;
        attendance_sessions?: Array<{
            attendance_session_id: number;
            weight: number;
            max_score?: number;
        }>;
        assignments?: Array<{
            assignment_id: number;
            weight: number;
            max_score?: number;
        }>;
        dependencies?: Array<{
            source_column_id: number;
            weight: number;
        }>;
    }
) => {
    // Xóa và tạo lại các relations nếu có
    if (data.attendance_sessions) {
        await prisma.gradeColumnAttendanceSession.deleteMany({
            where: { gradeColumnId: id },
        });
    }
    
    if (data.assignments) {
        await prisma.gradeColumnAssignment.deleteMany({
            where: { gradeColumnId: id },
        });
    }
    
    if (data.dependencies) {
        await prisma.gradeColumnDependency.deleteMany({
            where: { dependentColumnId: id },
        });
    }

    return prisma.gradeColumn.update({
        where: { id },
        data: {
            name: data.name,
            method: data.method,
            maxScore: data.max_score,
            weight: data.weight,
            displayOrder: data.display_order,
            isActive: data.is_active,
            
            attendanceSessions: data.attendance_sessions ? {
                create: data.attendance_sessions.map(s => ({
                    attendanceSessionId: s.attendance_session_id,
                    weight: s.weight,
                    maxScore: s.max_score,
                })),
            } : undefined,
            
            assignments: data.assignments ? {
                create: data.assignments.map(a => ({
                    assignmentId: a.assignment_id,
                    weight: a.weight,
                    maxScore: a.max_score,
                })),
            } : undefined,
            
            dependentColumns: data.dependencies ? {
                create: data.dependencies. map(d => ({
                    sourceColumnId: d.source_column_id,
                    weight: d.weight,
                })),
            } : undefined,
        },
        include: {
            attendanceSessions: {
                include: {
                    attendanceSession: true,
                },
            },
            assignments: {
                include: {
                    assignment: true,
                },
            },
            dependentColumns: {
                include: {
                    sourceColumn: true,
                },
            },
        },
    });
};

export const deleteGradeColumn = async (id: number) => {
    // Kiểm tra xem cột này có đang được dùng làm nguồn cho cột khác không
    const usedAsSource = await prisma.gradeColumnDependency.findFirst({
        where: { sourceColumnId: id },
    });
    
    if (usedAsSource) {
        throw new ApiError(400, "Cannot delete grade column that is used as source for other columns");
    }

    return prisma.gradeColumn. delete({ where: { id } });
};

// Tạo hàng loạt cột điểm theo template
export const bulkCreateGradeColumns = async (params: {
    section_id: number;
    template: "standard" | "custom";
    columns?: Array<{
        name: string;
        type: GradeColumnType;
        method: GradeCalculationMethod;
        weight?: number;
        display_order?: number;
    }>;
}) => {
    const section = await prisma.courseSection. findUnique({
        where: { id: params.section_id },
    });
    if (! section) throw new ApiError(404, "Section not found");

    let columnsToCreate: any[] = [];

    if (params.template === "standard") {
        // Template chuẩn: Điểm danh → Bài tập → Chuyên cần → Đồ án → Quá trình
        columnsToCreate = [
            {
                sectionId: params.section_id,
                name: "Điểm danh",
                type: "attendance_final",
                method: "auto_sum",
                maxScore: 10,
                weight: 0.05,
                displayOrder: 1,
            },
            {
                sectionId: params.section_id,
                name: "Bài tập",
                type: "attendance_final",
                method: "auto_average",
                maxScore: 10,
                weight: 0.05,
                displayOrder: 2,
            },
            {
                sectionId: params. section_id,
                name: "Điểm chuyên cần",
                type: "attendance_final",
                method: "weighted_average",
                maxScore: 10,
                weight: 0.1,
                displayOrder: 3,
            },
            {
                sectionId: params.section_id,
                name: "Điểm đồ án",
                type: "project",
                method: "manual",
                maxScore: 10,
                weight: 0.4,
                displayOrder: 4,
            },
            {
                sectionId: params.section_id,
                name: "Điểm quá trình",
                type: "process",
                method: "weighted_average",
                maxScore: 10,
                weight: 0.5,
                displayOrder: 5,
            },
        ];
    } else if (params.columns) {
        columnsToCreate = params.columns. map(col => ({
            sectionId: params.section_id,
            name: col.name,
            type: col.type,
            method: col.method,
            maxScore: 10,
            weight: col. weight || 0,
            displayOrder: col.display_order || 0,
        }));
    }

    // Tạo tất cả columns
    const created = await prisma.$transaction(
        columnsToCreate.map(col => prisma.gradeColumn.create({ data: col }))
    );

    // Nếu dùng template standard, tạo dependencies
    if (params.template === "standard" && created.length === 5) {
        await prisma.$transaction([
            // Điểm chuyên cần = 50% điểm danh + 50% bài tập
            prisma.gradeColumnDependency. create({
                data: {
                    dependentColumnId: created[2].id,
                    sourceColumnId: created[0].id,
                    weight: 0.5,
                },
            }),
            prisma.gradeColumnDependency.create({
                data: {
                    dependentColumnId: created[2].id,
                    sourceColumnId: created[1].id,
                    weight: 0.5,
                },
            }),
            
            // Điểm quá trình = 10% chuyên cần + 40% đồ án
            prisma.gradeColumnDependency.create({
                data: {
                    dependentColumnId: created[4].id,
                    sourceColumnId: created[2].id,
                    weight: 0.1,
                },
            }),
            prisma.gradeColumnDependency.create({
                data: {
                    dependentColumnId: created[4].id,
                    sourceColumnId: created[3].id,
                    weight: 0.4,
                },
            }),
        ]);
    }

    return created;
};