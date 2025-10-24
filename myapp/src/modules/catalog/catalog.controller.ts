// src/modules/catalog/catalog.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../prisma/client";

/**
 * Trả về danh mục dùng cho tất cả filter trên UI:
 * - terms       (học kỳ)
 * - subjects    (môn)
 * - teachers    (giảng viên)
 * - sections    (lớp học phần)
 *
 * FE truyền scopes="terms,subjects,sections,teachers"
 * Nếu không truyền -> trả tất cả.
 */
export async function getAdminCatalog(req: Request, res: Response, next: NextFunction) {
  try {
    const scopes = String(req.query.scopes || "")
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const ret: any = {};

    // 1. Terms
    if (!scopes.length || scopes.includes("terms")) {
      ret.terms = await prisma.term.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { id: "desc" },
      }).catch(() => []);
    }

    // 2. Subjects
    if (!scopes.length || scopes.includes("subjects")) {
      ret.subjects = await prisma.subject.findMany({
        select: {
          id: true,
          subjectCode: true,
          subjectName: true,
        },
        orderBy: [
          { subjectCode: "asc" },
          { subjectName: "asc" },
        ],
      }).catch(() => []);
    }

    // 3. Teachers (map Teacher -> { id, code, fullName })
    if (!scopes.length || scopes.includes("teachers")) {
      ret.teachers = await prisma.teacher.findMany({
        select: {
          id: true,
          teacherCode: true,
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          user: { fullName: "asc" },
        },
      }).then(rows =>
        rows.map(r => ({
          id: r.id,
          code: r.teacherCode,
          fullName: r.user.fullName,
        })),
      ).catch(() => []);
    }

    // 4. Sections (class / học phần)
    // bao gồm danh sách GV dạy để hiển thị trong option
    if (!scopes.length || scopes.includes("sections")) {
      ret.sections = await prisma.courseSection.findMany({
        select: {
          id: true,
          sectionCode: true,
          sectionName: true,
          subjectId: true,
          termId: true,
          instructors: {
            select: { teacherId: true },
          },
        },
        orderBy: { id: "desc" },
      }).then(rows =>
        rows.map(r => ({
          id: r.id,
          sectionCode: r.sectionCode,
          sectionName: r.sectionName ?? r.sectionCode,
          subjectId: r.subjectId,
          termId: r.termId,
          teacherIds: r.instructors.map(i => i.teacherId),
        })),
      ).catch(() => []);
    }

    res.json(ret);
  } catch (err) {
    next(err);
  }
}
