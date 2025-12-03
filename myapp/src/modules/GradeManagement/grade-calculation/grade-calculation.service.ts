import { prisma } from "../../../prisma/client";
import ApiError from "../../../utils/ApiError";
import { GradeCalculationMethod } from "@prisma/client";

// Tính điểm cho 1 sinh viên ở 1 cột điểm cụ thể
// grade-calculation.service.ts

export const calculateStudentGrade = async (params: {
  student_id: number;
  grade_column_id: number;
  force_recalculate?: boolean;
}) => {
  const column = await prisma.gradeColumn.findUnique({
    where: { id: params.grade_column_id },
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

  if (!column) throw new ApiError(404, "Grade column not found");

  if (column.method === "manual") {
    throw new ApiError(400, "Cannot auto-calculate for manual grade columns");
  }

  const existingGrade = await prisma.studentGrade.findUnique({
    where: {
      studentId_gradeColumnId: {
        studentId: params.student_id,
        gradeColumnId: params.grade_column_id,
      },
    },
  });

  if (existingGrade && ! params.force_recalculate && existingGrade.isOverridden) {
    return existingGrade;
  }

  let calculatedScore = 0;

  // === AUTO_SUM: Cộng tổng ===
  if (column.method === "auto_sum") {
    for (const sessionLink of column.attendanceSessions) {
      const attendance = await prisma.attendance.findFirst({
        where: {
          sessionId: sessionLink.attendanceSessionId,
          studentId: params.student_id,
        },
      });

      if (attendance && attendance.score) {
        calculatedScore += attendance.score;
      }
    }
  }

  // === AUTO_AVERAGE: Trung bình ===
  else if (column.method === "auto_average") {
    let totalScore = 0;
    let count = 0;

    for (const assignmentLink of column.assignments) {
      const submission = await prisma.submission.findFirst({
        where: {
          assignmentId: assignmentLink.assignmentId,
          studentId: params.student_id,
          isFinal: true,
        },
        orderBy: { submittedAt: "desc" },
      });

      if (submission && submission.score !== null) {
        const maxScore = assignmentLink.maxScore || assignmentLink.assignment.maxScore;
        const normalizedScore = (submission.score / maxScore) * 10;
        totalScore += normalizedScore * assignmentLink.weight;
        count += assignmentLink.weight;
      }
    }

    calculatedScore = count > 0 ? totalScore / count : 0;
  }

  // === WEIGHTED_AVERAGE ===
  else if (column. method === "weighted_average") {
    // ✅ Trường hợp: attendance_final
    if (column. type === "attendance_final") {
      // Điểm danh (cộng tổng)
      let attendanceScore = 0;
      for (const sessionLink of column.attendanceSessions) {
        const attendance = await prisma.attendance. findFirst({
          where: {
            sessionId: sessionLink. attendanceSessionId,
            studentId: params.student_id,
          },
        });

        if (attendance && attendance.score) {
          attendanceScore += attendance.score;
        }
      }

      // Điểm bài tập (trung bình)
      let homeworkScore = 0;
      let homeworkCount = 0;
      
      for (const assignmentLink of column.assignments) {
        const submission = await prisma.submission. findFirst({
          where: {
            assignmentId: assignmentLink.assignmentId,
            studentId: params.student_id,
            isFinal: true,
          },
          orderBy: { submittedAt: "desc" },
        });

        if (submission && submission.score !== null) {
          const maxScore = assignmentLink.maxScore || assignmentLink.assignment.maxScore;
          const normalizedScore = (submission.score / maxScore) * 10;
          homeworkScore += normalizedScore;
          homeworkCount++;
        }
      }

      const avgHomeworkScore = homeworkCount > 0 ? homeworkScore / homeworkCount : 0;
      calculatedScore = (attendanceScore + avgHomeworkScore) / 2;
    } 
    // ✅ Trường hợp: process hoặc các loại khác
    else {
      let totalWeightedScore = 0;

      for (const dep of column.dependentColumns) {
        const sourceGrade = await prisma.studentGrade.findUnique({
          where: {
            studentId_gradeColumnId: {
              studentId: params.student_id,
              gradeColumnId: dep.sourceColumnId,
            },
          },
        });

        if (sourceGrade) {
          const score = sourceGrade.isOverridden 
            ? sourceGrade.overriddenScore!   
            : sourceGrade.score! ;
          
          totalWeightedScore += score * dep.weight;
        }
      }

      // ✅ CÔNG THỨC LINH ĐỘNG: Chia cho weight thay vì nhân 2
      // Nếu weight = 0.5 => chia 0.5 = nhân 2
      // Nếu weight = 0.3 => chia 0.3 = nhân 3. 33
      // Nếu weight = 0.4 => chia 0.4 = nhân 2.5
      if (column.type === "process" && column.weight !== null && column.weight > 0) {
        calculatedScore = totalWeightedScore / column.weight;
      } else {
        calculatedScore = totalWeightedScore;
      }
    }
  }

  // Làm tròn 2 chữ số
  calculatedScore = Math.round(calculatedScore * 100) / 100;

  // Đảm bảo không vượt quá maxScore
  if (calculatedScore > column.maxScore) {
    calculatedScore = column.maxScore;
  }

  // Lưu vào database
  const savedGrade = await prisma.studentGrade.upsert({
    where: {
      studentId_gradeColumnId: {
        studentId: params.student_id,
        gradeColumnId: params.grade_column_id,
      },
    },
    update: {
      score: calculatedScore,
      maxScore: column.maxScore,
      isAutoCalculated: true,
      calculatedAt: new Date(),
    },
    create: {
      studentId: params.student_id,
      gradeColumnId: params.grade_column_id,
      score: calculatedScore,
      maxScore: column.maxScore,
      isAutoCalculated: true,
      calculatedAt: new Date(),
    },
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
      gradeColumn: true,
    },
  });

  return savedGrade;
};

// Tính điểm cho nhiều sinh viên ở 1 cột
export const calculateGradeColumn = async (params: {
    grade_column_id: number;
    student_ids?: number[];
    force_recalculate?: boolean;
}) => {
    const column = await prisma.gradeColumn.findUnique({
        where: { id: params.grade_column_id },
        include: {
            section: true,
        },
    });

    if (!column) throw new ApiError(404, "Grade column not found");

    // Lấy danh sách sinh viên
    let studentIds = params.student_ids;
    if (!studentIds) {
        const enrollments = await prisma.sectionEnrollment.findMany({
            where: {
                sectionId: column.sectionId,
                status: "enrolled",
            },
            select: { studentId: true },
        });
        studentIds = enrollments.map((e) => e.studentId);
    }

    // Tính điểm cho từng sinh viên
    const results = [];
    for (const studentId of studentIds) {
        try {
            const grade = await calculateStudentGrade({
                student_id: studentId,
                grade_column_id: params.grade_column_id,
                force_recalculate: params.force_recalculate,
            });
            results.push({ success: true, studentId, grade });
        } catch (error: any) {
            results.push({ success: false, studentId, error: error.message });
        }
    }

    return {
        total: studentIds.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
    };
};

// Tính tất cả điểm cho 1 section (theo thứ tự phụ thuộc)
export const calculateAllGrades = async (params: {
    section_id: number;
    student_ids?: number[];
    force_recalculate?: boolean;
}) => {
    // Lấy tất cả columns theo thứ tự displayOrder
    const columns = await prisma.gradeColumn.findMany({
        where: {
            sectionId: params.section_id,
            isActive: true,
        },
        orderBy: { displayOrder: "asc" },
        include: {
            dependentColumns: true,
        },
    });

    // Sắp xếp theo dependency (cột không phụ thuộc tính trước)
    const sortedColumns = topologicalSort(columns);

    const allResults: any = {};

    for (const column of sortedColumns) {
        if (column.method === "manual") continue; // Bỏ qua cột nhập tay

        const result = await calculateGradeColumn({
            grade_column_id: column.id,
            student_ids: params.student_ids,
            force_recalculate: params.force_recalculate,
        });

        allResults[column.name] = result;
    }

    return allResults;
};

// Preview tính điểm (không lưu vào DB)
// grade-calculation. service.ts

export const previewGradeCalculation = async (params: {
    student_id: number;
    grade_column_id: number;
}) => {
    const column = await prisma.gradeColumn.findUnique({
        where: { id: params.grade_column_id },
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

    if (!column) throw new ApiError(404, "Grade column not found");

    const breakdown: any = {
        method: column.method,
        type: column.type,
        weight: column.weight,
        components: [],
        formula: "",
        calculatedScore: 0,
    };

    if (column.method === "auto_sum") {
        for (const sessionLink of column.attendanceSessions) {
            const attendance = await prisma.attendance.findFirst({
                where: {
                    sessionId: sessionLink.attendanceSessionId,
                    studentId: params.student_id,
                },
            });

            breakdown.components.push({
                type: "attendance",
                name:
                    sessionLink.attendanceSession.name ||
                    `Session ${sessionLink.attendanceSessionId}`,
                score: attendance?.score || 0,
                maxScore:
                    sessionLink.maxScore ||
                    sessionLink.attendanceSession.sessionScore,
            });

            breakdown.calculatedScore += attendance?.score || 0;
        }

        breakdown.formula = breakdown.components
            .map((c: any) => c.score)
            .join(" + ");
    } else if (column.method === "auto_average") {
        let total = 0;
        let count = 0;

        for (const assignmentLink of column.assignments) {
            const submission = await prisma.submission.findFirst({
                where: {
                    assignmentId: assignmentLink.assignmentId,
                    studentId: params.student_id,
                    isFinal: true,
                },
            });

            const maxScore =
                assignmentLink.maxScore || assignmentLink.assignment.maxScore;
            const normalizedScore = submission?.score
                ? (submission.score / maxScore) * 10
                : 0;

            breakdown.components.push({
                type: "assignment",
                name: assignmentLink.assignment.title,
                score: submission?.score || 0,
                maxScore,
                normalizedScore,
                weight: assignmentLink.weight,
            });

            total += normalizedScore * assignmentLink.weight;
            count += assignmentLink.weight;
        }

        breakdown.calculatedScore = count > 0 ? total / count : 0;
        breakdown.formula = `(${breakdown.components
            .map((c: any) => `${c.normalizedScore.toFixed(2)} * ${c.weight}`)
            .join(" + ")}) / ${count}`;
    } else if (column.method === "weighted_average") {
        // ✅ TRƯỜNG HỢP ĐẶC BIỆT: attendance_final
        if (column.type === "attendance_final") {
            // Tính điểm danh
            let attendanceScore = 0;
            const attendanceComponents: any[] = [];

            for (const sessionLink of column.attendanceSessions) {
                const attendance = await prisma.attendance.findFirst({
                    where: {
                        sessionId: sessionLink.attendanceSessionId,
                        studentId: params.student_id,
                    },
                });

                const score = attendance?.score || 0;
                attendanceScore += score;

                attendanceComponents.push({
                    type: "attendance",
                    name:
                        sessionLink.attendanceSession.name ||
                        `Buổi ${sessionLink.attendanceSessionId}`,
                    score,
                    maxScore:
                        sessionLink.maxScore ||
                        sessionLink.attendanceSession.sessionScore,
                });
            }

            // Tính điểm bài tập
            let homeworkScore = 0;
            let homeworkCount = 0;
            const homeworkComponents: any[] = [];

            for (const assignmentLink of column.assignments) {
                const submission = await prisma.submission.findFirst({
                    where: {
                        assignmentId: assignmentLink.assignmentId,
                        studentId: params.student_id,
                        isFinal: true,
                    },
                });

                if (submission && submission.score !== null) {
                    const maxScore =
                        assignmentLink.maxScore ||
                        assignmentLink.assignment.maxScore;
                    const normalizedScore = (submission.score / maxScore) * 10;
                    homeworkScore += normalizedScore;
                    homeworkCount++;

                    homeworkComponents.push({
                        type: "assignment",
                        name: assignmentLink.assignment.title,
                        score: submission.score,
                        maxScore,
                        normalizedScore,
                    });
                }
            }

            const avgHomeworkScore =
                homeworkCount > 0 ? homeworkScore / homeworkCount : 0;

            // Kết hợp components
            breakdown.components = [
                {
                    type: "group",
                    name: "Điểm danh (cộng tổng)",
                    score: attendanceScore,
                    details: attendanceComponents,
                },
                {
                    type: "group",
                    name: "Bài tập (trung bình)",
                    score: avgHomeworkScore,
                    details: homeworkComponents,
                },
            ];

            breakdown.calculatedScore =
                (attendanceScore + avgHomeworkScore) / 2;
            breakdown.formula = `(AttendanceScore: ${attendanceScore.toFixed(
                2
            )} + HomeworkScore: ${avgHomeworkScore.toFixed(2)}) / 2`;
        } else if (column.type === "process") {
            let total = 0;

            for (const dep of column.dependentColumns) {
                const sourceGrade = await prisma.studentGrade.findUnique({
                    where: {
                        studentId_gradeColumnId: {
                            studentId: params.student_id,
                            gradeColumnId: dep.sourceColumnId,
                        },
                    },
                });

                const score = sourceGrade?.isOverridden
                    ? sourceGrade.overriddenScore!
                    : sourceGrade?.score || 0;

                breakdown.components.push({
                    type: "grade_column",
                    name: dep.sourceColumn.name,
                    score,
                    weight: dep.weight,
                    weightedScore: score * dep.weight,
                });

                total += score * dep.weight;
            }

            // ✅ Công thức linh động
            const weightDivisor = column.weight && column.weight > 0 ? column.weight : 0.5;
            breakdown.calculatedScore = total / weightDivisor;

            breakdown.formula = `(${breakdown.components
                .map((c: any) => `${c.score} × ${c.weight}`)
                .join(" + ")}) / ${weightDivisor}`;

            breakdown.explanation = `Chia cho hệ số ${weightDivisor} để chuẩn hóa về thang 10`;
        }
    }

    breakdown.calculatedScore =
        Math.round(breakdown.calculatedScore * 100) / 100;

    return breakdown;
};

// Helper: Topological sort để sắp xếp columns theo dependency
function topologicalSort(columns: any[]) {
    const sorted: any[] = [];
    const visited = new Set<number>();

    function visit(column: any) {
        if (visited.has(column.id)) return;
        visited.add(column.id);

        // Tính các cột phụ thuộc trước
        for (const dep of column.dependentColumns || []) {
            const sourceColumn = columns.find(
                (c) => c.id === dep.sourceColumnId
            );
            if (sourceColumn) visit(sourceColumn);
        }

        sorted.push(column);
    }

    for (const column of columns) {
        visit(column);
    }

    return sorted;
}
