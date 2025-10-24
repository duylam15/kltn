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
export async function getAttendanceAgg(
  sectionIds: number[],
  from?: Date,
  to?: Date,
) {
  // 1) Lấy danh sách session thuộc các section đó
  const sessions = await prisma.attendanceSession.findMany({
    where: {
      sectionId: { in: sectionIds },
      ...(from ? { createdAt: { gte: from } } : {}),
      ...(to ? { createdAt: { lte: to } } : {}),
    },
    select: {
      id: true,
      sectionId: true,
    },
  });

  const sessIds = sessions.map(s => s.id);
  if (!sessIds.length) return [];

  // 2) Lấy attendance từng session
  const recs = await prisma.attendance.findMany({
    where: { sessionId: { in: sessIds } },
    select: {
      sessionId: true,
      status: true, // "present", "late", "excused", "absent"
    },
  });

  // sessionId -> {present,late,excused,absent,total}
  const bySession = new Map<number, { present: number; late: number; excused: number; absent: number; total: number }>();
  sessions.forEach(s => {
    bySession.set(s.id, {
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      total: 0,
    });
  });

  const norm = (x: string) =>
    x.toLowerCase() as "present" | "late" | "excused" | "absent";

  for (const rec of recs) {
    const bucket = bySession.get(rec.sessionId);
    if (!bucket) continue;
    const st = norm(rec.status as any);
    (bucket as any)[st] = ((bucket as any)[st] ?? 0) + 1;
    bucket.total += 1;
  }

  // gộp từ session -> section
  const bySection: Record<
    number,
    { present: number; late: number; excused: number; absent: number; total: number }
  > = {};

  sessions.forEach(s => {
    const sAgg = bySession.get(s.id)!;
    const secAgg =
      bySection[s.sectionId] ??
      (bySection[s.sectionId] = {
        present: 0,
        late: 0,
        excused: 0,
        absent: 0,
        total: 0,
      });

    secAgg.present += sAgg.present;
    secAgg.late += sAgg.late;
    secAgg.excused += sAgg.excused;
    secAgg.absent += sAgg.absent;
    secAgg.total += sAgg.total;
  });

  // tính tỉ lệ
  return Object.entries(bySection).map(([sectionId, v]) => {
    const denom = v.total || 1;
    const rate = ((v.present + v.late) / denom) * 100;
    return {
      sectionId: Number(sectionId),
      present: v.present,
      late: v.late,
      excused: v.excused,
      absent: v.absent,
      total: v.total,
      rate: +rate.toFixed(2),
    };
  });
}

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
