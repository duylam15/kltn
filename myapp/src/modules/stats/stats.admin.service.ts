// src/modules/stats/stats.admin.service.ts
import {prisma} from "../../prisma/client";

export type TotalRow = {
  sectionId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  total10: number; // 0..10
};

export const bucketSchemes: Record<string, { label:string; from:number; to:number }[]> = {
  vn10: [
    { label: "<5",     from: 0,   to: 5 },
    { label: "5–<6.5", from: 5,   to: 6.5 },
    { label: "6.5–<8", from: 6.5, to: 8 },
    { label: "8–10",   from: 8,   to: 10.0001 },
  ]
};

/** Lấy danh sách assignment của section */
async function getSectionAssignments(sectionIds: number[]) {
  const links = await prisma.sectionAssignment.findMany({
    where: { sectionId: { in: sectionIds } },
    select: { sectionId: true, assignmentId: true, assignment: { select: { id: true, maxScore: true, title: true } } }
  });
  const bySection = new Map<number, { id: number; maxScore: number|null }[]>();
  for (const l of links) {
    const arr = bySection.get(l.sectionId) ?? [];
    arr.push({ id: l.assignmentId, maxScore: l.assignment.maxScore ?? null });
    bySection.set(l.sectionId, arr);
  }
  return bySection;
}

/** Lấy danh sách SV theo section */
async function getEnrollments(sectionIds: number[]) {
  const rows = await prisma.sectionEnrollment.findMany({
    where: { sectionId: { in: sectionIds }, status: "enrolled" },
    select: {
      sectionId: true,
      studentId: true,
      student: {
        select: {
          studentCode: true,
          user: { select: { fullName: true } }
        }
      }
    }
  });
  return rows.map(r => ({
    sectionId: r.sectionId,
    studentId: r.studentId,
    studentCode: r.student.studentCode,
    studentName: r.student.user.fullName
  }));
}

/** Lấy submissions cho các assignment ở các section đã chọn */
async function getSubmissionsByAssignments(assignmentIds: number[], studentIds: number[]) {
  if (!assignmentIds.length || !studentIds.length) return [];
  const subs = await prisma.submission.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      studentId: { in: studentIds }
    },
    select: {
      assignmentId: true, studentId: true,
      score: true, maxScore: true,
    }
  });
  return subs;
}

/** Tính total10 theo từng SV x section (mean của các assignment normalized) */
export async function computeTotalsBySections(sectionIds: number[]): Promise<TotalRow[]> {
  // 1) assignments per section
  const assBySection = await getSectionAssignments(sectionIds);

  // 2) enrolled students
  const enrolls = await getEnrollments(sectionIds);
  const studentIds = Array.from(new Set(enrolls.map(e => e.studentId)));

  // 3) load all subs
  const allAssIds = Array.from(new Set(Array.from(assBySection.values()).flat().map(a => a.id)));
  const subs = await getSubmissionsByAssignments(allAssIds, studentIds);
  const subIndex = new Map<string, { score:number|null, maxScore:number|null }>();
  const key = (sid:number, aid:number) => `${sid}-${aid}`;
  subs.forEach(s => subIndex.set(key(s.studentId, s.assignmentId), { score: s.score ?? null, maxScore: s.maxScore ?? null }));

  // 4) compute per student-section
  const rows: TotalRow[] = [];
  for (const en of enrolls) {
    const assList = assBySection.get(en.sectionId) ?? [];
    const n = assList.length || 1;
    let sum = 0;
    for (const a of assList) {
      const sub = subIndex.get(key(en.studentId, a.id));
      const score = sub?.score ?? 0;
      const denom = (sub?.maxScore ?? a.maxScore ?? 100) || 100;
      const normalized10 = (score / denom) * 10;
      sum += normalized10;
    }
    const total10 = +(sum / n).toFixed(2);
    rows.push({
      sectionId: en.sectionId,
      studentId: en.studentId,
      studentCode: en.studentCode,
      studentName: en.studentName,
      total10
    });
  }
  return rows;
}

/** Attendance aggregate theo section */
export async function getAttendanceAgg(sectionIds: number[], from?: Date, to?: Date) {
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      sectionId: { in: sectionIds },
      ...(from ? { createdAt: { gte: from } } : {}),
      ...(to   ? { createdAt: { lte: to } } : {}),
    },
    select: { id: true, sectionId: true }
  });
  const sessIds = sessions.map(s => s.id);
  if (!sessIds.length) return [];

  const recs = await prisma.attendance.findMany({
    where: { sessionId: { in: sessIds } },
    select: { sessionId: true, status: true }
  });

  const bySess = new Map<number, { present:number; late:number; excused:number; absent:number; total:number }>();
  sessions.forEach(s => bySess.set(s.id, { present:0, late:0, excused:0, absent:0, total:0 }));
  const norm = (x:string)=>x.toLowerCase() as "present"|"late"|"excused"|"absent";
  for (const r of recs) {
    const a = bySess.get(r.sessionId)!;
    const st = norm(r.status as any);
    (a as any)[st] = ((a as any)[st] ?? 0) + 1;
    a.total += 1;
  }

  const bySec: Record<number, { present:number; late:number; excused:number; absent:number; total:number }> = {};
  sessions.forEach(s => {
    const a = bySess.get(s.id)!;
    const sec = (bySec[s.sectionId] ??= { present:0, late:0, excused:0, absent:0, total:0 });
    sec.present += a.present; sec.late += a.late; sec.excused += a.excused; sec.absent += a.absent; sec.total += a.total;
  });

  return Object.entries(bySec).map(([sectionId, v]) => {
    const denom = v.total || 1;
    const rate = ((v.present + v.late) / denom) * 100;
    return { sectionId: +sectionId, ...v, rate: +rate.toFixed(2) };
  });
}
