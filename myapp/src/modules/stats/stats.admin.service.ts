// src/modules/stats/stats.service.ts
import { prisma } from "../../prisma/client";

/** Row điểm tổng hợp của 1 SV trong 1 section */
export type TotalRow = {
  sectionId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  total10: number; // điểm TB quy đổi thang 10
};

/** Cấu hình bucket điểm (để vẽ biểu đồ phân bố điểm) */
export type BucketDef = { label: string; from: number; to: number };

/**
 * FE đang gửi scheme như "0-10", "5-6.5", "6.5-8", "8-10"
 * Nhưng thực ra ta luôn muốn 4 khung:
 *   <5 | 5–<6.5 | 6.5–<8 | 8–10
 * Ta chuẩn hoá về 1 scheme duy nhất.
 */
export function resolveBucketScheme(_schemeFromClient?: string): BucketDef[] {
  return [
    { label: "<5",        from: 0,   to: 5 },
    { label: "5–<6.5",    from: 5,   to: 6.5 },
    { label: "6.5–<8",    from: 6.5, to: 8 },
    { label: "8–10",      from: 8,   to: 10.0001 },
  ];
}

/** Lấy assignments thuộc các section */
async function getSectionAssignments(sectionIds: number[]) {
  // sectionAssignment: nối giữa section và assignment
  // assignment.maxScore: điểm tối đa bài đó
  const links = await prisma.sectionAssignment.findMany({
    where: { sectionId: { in: sectionIds } },
    select: {
      sectionId: true,
      assignmentId: true,
      assignment: {
        select: {
          id: true,
          maxScore: true,
          title: true,
        },
      },
    },
  });

  // Map<sectionId, {id, maxScore}[]>
  const bySection = new Map<number, { id: number; maxScore: number | null }[]>();
  for (const l of links) {
    const arr = bySection.get(l.sectionId) ?? [];
    arr.push({
      id: l.assignmentId,
      maxScore: l.assignment.maxScore ?? null,
    });
    bySection.set(l.sectionId, arr);
  }
  return bySection;
}

/** Lấy sinh viên đang enroll trong các section */
async function getEnrollments(sectionIds: number[]) {
  // sectionEnrollment.status === "enrolled"
  const rows = await prisma.sectionEnrollment.findMany({
    where: {
      sectionId: { in: sectionIds },
      status: "enrolled",
    },
    select: {
      sectionId: true,
      studentId: true,
      student: {
        select: {
          studentCode: true,
          user: {
            select: { fullName: true },
          },
        },
      },
    },
  });

  return rows.map(r => ({
    sectionId: r.sectionId,
    studentId: r.studentId,
    studentCode: r.student.studentCode,
    studentName: r.student.user.fullName,
  }));
}

/** Lấy tất cả submission của các assignment cần thiết */
async function getSubmissions(assignmentIds: number[], studentIds: number[]) {
  if (!assignmentIds.length || !studentIds.length) return [];

  return prisma.submission.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      studentId: { in: studentIds },
    },
    select: {
      assignmentId: true,
      studentId: true,
      score: true,
      maxScore: true, // đôi khi submission có maxScore override
    },
  });
}

/**
 * Tính điểm TB (thang 10) cho từng sinh viên trong từng section.
 * Công thức:
 *   - Lấy tất cả assignment trong section.
 *   - Với mỗi assignment, lấy score/maxScore -> chuẩn hoá về 10 điểm.
 *   - Lấy trung bình các assignment.
 */
export async function computeTotalsBySections(sectionIds: number[]): Promise<TotalRow[]> {
  // 1) assignments theo section
  const assBySection = await getSectionAssignments(sectionIds);

  // 2) enrollment (sv trong section)
  const enrolls = await getEnrollments(sectionIds);
  const studentIds = Array.from(new Set(enrolls.map(e => e.studentId)));

  // 3) submissions của tất cả assignment đó
  const allAssIds = Array.from(
    new Set(
      Array.from(assBySection.values()).flat().map(a => a.id),
    ),
  );
  const subs = await getSubmissions(allAssIds, studentIds);

  // build index: key = `${studentId}-${assignmentId}`
  const subIndex = new Map<string, { score: number | null; maxScore: number | null }>();
  const key = (sid: number, aid: number) => `${sid}-${aid}`;
  subs.forEach(s => {
    subIndex.set(key(s.studentId, s.assignmentId), {
      score: s.score ?? null,
      maxScore: s.maxScore ?? null,
    });
  });

  // 4) duyệt từng sinh viên trong từng section để tính total10
  const rows: TotalRow[] = [];
  for (const en of enrolls) {
    const assList = assBySection.get(en.sectionId) ?? [];

    const n = assList.length || 1;
    let sum = 0;

    for (const a of assList) {
      const sub = subIndex.get(key(en.studentId, a.id));
      const score = sub?.score ?? 0;
      // ưu tiên maxScore từ submission, fallback assignment.maxScore, fallback 100
      const denom =
        (sub?.maxScore ?? a.maxScore ?? 100) || 100;
      const normalized10 = (score / denom) * 10;
      sum += normalized10;
    }

    const total10 = +(sum / n).toFixed(2);

    rows.push({
      sectionId: en.sectionId,
      studentId: en.studentId,
      studentCode: en.studentCode,
      studentName: en.studentName,
      total10,
    });
  }

  return rows;
}

// === NEW: Lấy map sectionId -> credits (Subject.credits) ===
async function getSectionCredits(sectionIds: number[]): Promise<Map<number, number>> {
  if (!sectionIds.length) return new Map();
  const secs = await prisma.courseSection.findMany({
    where: { id: { in: sectionIds } },
    select: {
      id: true,
      subject: { select: { credits: true } },
    },
  });
  const m = new Map<number, number>();
  for (const s of secs) {
    const c = s.subject?.credits ?? 3; // fallback nếu thiếu
    m.set(s.id, c);
  }
  return m;
}

/**
 * NEW: GPA tích lũy thang 10 có trọng số tín chỉ
 * - Đầu vào: sectionIds (phạm vi tính)
 * - Đầu ra: mỗi sinh viên 1 dòng { studentId, studentCode, studentName, credits, gpa10 }
 */
export async function computeCumulative10BySections(sectionIds: number[]) {
  if (!sectionIds.length) return [];

  // 1) Điểm tổng kết từng SV/section (đã có)
  const totals = await computeTotalsBySections(sectionIds); // [{sectionId, studentId, total10, ...}]

  // 2) Map sectionId -> credits
  const creditMap = await getSectionCredits(sectionIds);

  // 3) Cộng dồn theo SV với trọng số tín chỉ
  type Acc = { studentCode: string; studentName: string; wSum: number; cSum: number };
  const acc = new Map<number, Acc>(); // key: studentId

  for (const row of totals) {
    const credits = creditMap.get(row.sectionId) ?? 3;
    const a = acc.get(row.studentId) || {
      studentCode: row.studentCode,
      studentName: row.studentName,
      wSum: 0,
      cSum: 0,
    };
    a.wSum += (row.total10 ?? 0) * credits;
    a.cSum += credits;
    acc.set(row.studentId, a);
  }

  // 4) Kết quả
  const items = Array.from(acc.entries()).map(([studentId, a]) => {
    const gpa10 = a.cSum > 0 ? +(a.wSum / a.cSum).toFixed(2) : 0;
    return {
      studentId,
      studentCode: a.studentCode,
      studentName: a.studentName,
      credits: a.cSum,
      gpa10,
    };
  });

  return items;
}


/**
 * Gộp dữ liệu điểm thành buckets để vẽ biểu đồ phân bố.
 * Input:
 *  - sectionIds[]
 * Output:
 *  - { scheme, buckets, total, series[{label,count}] }
 */
export async function computeBucketSeries(sectionIds: number[], bucketDefs: BucketDef[]) {
  const totals = await computeTotalsBySections(sectionIds);
  const series = bucketDefs.map(b => ({
    label: b.label,
    count: totals.filter(t => t.total10 >= b.from && t.total10 < b.to).length,
  }));

  return {
    buckets: bucketDefs,
    total: totals.length,
    series,
  };
}

/**
 * Tính chuyên cần:
 *  - Lấy tất cả attendanceSession thuộc sectionIds (có thể filter theo from/to createdAt)
 *  - Gom tất cả bản ghi attendance
 *  - Kết quả cho mỗi section:
 *      present / late / excused / absent / total / rate%
 *
 * NOTE:
 *  rate% = (present+late)/total * 100
 */

/**
 * mode='section'  -> ids[] là các sectionId
 * mode='subject'  -> ids[] là các subjectId => cần map ra các sectionId thuộc các subject đó
 */
export async function resolveSectionIds(mode: string, ids: number[]): Promise<number[]> {
  if (!ids.length) return [];

  if (mode === "section") {
    return ids;
  }

  if (mode === "subject" || mode === "course") {
    const secs = await prisma.courseSection.findMany({
      where: {
        subjectId: { in: ids },
      },
      select: { id: true },
    });
    return secs.map(s => s.id);
  }

  // mode lạ -> trả rỗng
  return [];
}


// Chuẩn hoá status về 4 nhóm
function normalizeStatus(s: string | null): "present" | "late" | "excused" | "absent" {
  const x = String(s || "").toLowerCase();
  if (x === "present") return "present";
  if (x === "late") return "late";
  if (x === "excused") return "excused";
  if (x === "absent") return "absent";
  if (x === "warning") return "late"; // quy ước: warning tính là "trễ"
  return "absent";
}

/**
 * Lấy chuyên cần theo nhiều section.
 * - from/to: lọc theo thời gian của phiên (AttendanceSession.createdAt)
 * - denom: "sessions" | "records"
 *   + sessions: total = số buổi (sessionsCount),
 *               rate = (present+late) / (rosterSize * sessionsCount) * 100
 *   + records : total = present+late+excused+absent,
 *               rate = (present+late) / total * 100   (cách cũ)
 */
export async function getAttendanceAgg(
  sectionIds: number[],
  from?: Date,
  to?: Date,
  denom: "sessions" | "records" = "sessions"
): Promise<Array<{ sectionId:number; present:number; late:number; excused:number; absent:number; total:number; rate:number; sessions:number; roster:number }>> {

  // 1) Lấy các session thuộc các section (lọc theo from/to)
  const sessionWhere: any = { sectionId: { in: sectionIds } };
  if (from || to) {
    sessionWhere.createdAt = {};
    if (from) sessionWhere.createdAt.gte = from;
    if (to)   sessionWhere.createdAt.lte = to;
  }
  const sessions = await prisma.attendanceSession.findMany({
    where: sessionWhere,
    select: { id: true, sectionId: true },
  });

  const sessionIdsAll = sessions.map(s => s.id);
  const sessionsBySec = new Map<number, number[]>();
  for (const s of sessions) {
    const arr = sessionsBySec.get(s.sectionId) || [];
    arr.push(s.id);
    sessionsBySec.set(s.sectionId, arr);
  }

  // 2) Sĩ số mỗi section
  const rosterRows = await prisma.sectionEnrollment.groupBy({
    by: ["sectionId"],
    where: { sectionId: { in: sectionIds } },
    _count: { _all: true },
  });
  const rosterBySec = new Map<number, number>();
  for (const r of rosterRows) rosterBySec.set(r.sectionId, r._count._all);

  // 3) Lấy attendance của các session ở (1)
  //    (groupBy không join được, nên lấy list rồi tự gộp theo session.sectionId)
  let presentBySec = new Map<number, number>();
  let lateBySec    = new Map<number, number>();
  let excBySec     = new Map<number, number>();
  let absBySec     = new Map<number, number>();

  if (sessionIdsAll.length) {
    const atts = await prisma.attendance.findMany({
      where: { sessionId: { in: sessionIdsAll } },
      select: { sessionId: true, status: true },
    });

    // map sessionId -> sectionId
    const secBySession = new Map<number, number>();
    for (const s of sessions) secBySession.set(s.id, s.sectionId);

    const plus = (m: Map<number, number>, k: number, inc: number) => m.set(k, (m.get(k) || 0) + inc);

    for (const a of atts) {
      const secId = secBySession.get(a.sessionId);
      if (!secId) continue;
      const norm = normalizeStatus(a.status as any);
      if (norm === "present") plus(presentBySec, secId, 1);
      else if (norm === "late") plus(lateBySec, secId, 1);
      else if (norm === "excused") plus(excBySec, secId, 1);
      else plus(absBySec, secId, 1);
    }
  }

  // 4) Kết quả cho từng section
  const result = sectionIds.map(secId => {
    const sessionsCount = (sessionsBySec.get(secId) || []).length;
    const rosterSize    = rosterBySec.get(secId) || 0;

    const present = presentBySec.get(secId) || 0;
    const late    = lateBySec.get(secId)    || 0;
    const excused = excBySec.get(secId)     || 0;
    const absent  = absBySec.get(secId)     || 0;

    let totalRecords = present + late + excused + absent;

    let total: number;
    let rate: number;

    if (denom === "sessions") {
      // total = số buổi; rate dựa trên (sĩ số * số buổi)
      total = sessionsCount;
      const denomValue = rosterSize * Math.max(1, sessionsCount); // tránh chia 0
      rate = denomValue ? +(((present + late) / denomValue) * 100).toFixed(1) : 0;
    } else {
      // kiểu cũ
      total = totalRecords;
      rate = total ? +(((present + late) / total) * 100).toFixed(1) : 0;
    }

    return {
      sectionId: secId,
      present, late, excused, absent,
      total,          // ⇦ theo yêu cầu: số buổi nếu denom="sessions"
      rate,
      sessions: sessionsCount,
      roster: rosterSize,
    };
  });

  return result;
}