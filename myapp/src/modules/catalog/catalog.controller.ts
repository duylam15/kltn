// src/modules/catalog/catalog.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../prisma/client";

export async function getAdminCatalog(req: Request, res: Response, next: NextFunction) {
  try {
    const scopes = String(req.query.scopes || "")
      .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const ret: any = {};

    // Terms
    if (!scopes.length || scopes.includes("terms")) {
      ret.terms = await prisma.term.findMany({
        select: { id: true, code: true, name: true, startDate: true, endDate: true },
        orderBy: { id: "desc" }
      }).catch(() => []);
    }

    // Subjects (nếu dự án dùng model Subject; nếu tên khác, đổi tại đây)
    if (!scopes.length || scopes.includes("subjects")) {
      ret.subjects = await prisma.subject.findMany({
        select: { id: true, subjectCode: true, subjectName: true },
        orderBy: [{ subjectCode: "asc" }, { subjectName: "asc" }]
      }).catch(() => []);
    }

    // Teachers (lấy từ Teacher + User)
    if (!scopes.length || scopes.includes("teachers")) {
      ret.teachers = await prisma.teacher.findMany({
        select: { id: true, teacherCode: true, user: { select: { id: true, fullName: true } } },
        orderBy: { user: { fullName: "asc" } }
      }).then(rows => rows.map(r => ({
        id: r.id, code: r.teacherCode, fullName: r.user.fullName
      }))).catch(() => []);
    }

    // Sections + teacherIds từ SectionInstructor
    if (!scopes.length || scopes.includes("sections")) {
      ret.sections = await prisma.courseSection.findMany({
        select: {
          id: true,
          sectionCode: true,
          sectionName: true,
          subjectId: true,
          termId: true,
          instructors: { select: { teacherId: true } }, // quan trọng
        },
        orderBy: { id: "desc" }
      }).then(rows => rows.map(r => ({
        id: r.id,
        sectionCode: r.sectionCode,
        sectionName: r.sectionName ?? r.sectionCode,
        subjectId: r.subjectId,
        termId: r.termId,
        teacherIds: r.instructors.map(i => i.teacherId), // mảng GV dạy section
      }))).catch(() => []);
    }

    res.json(ret);
  } catch (e) { next(e); }
}


