"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSectionGrades = getSectionGrades;
exports.getGradeBuckets = getGradeBuckets;
exports.getAttendance = getAttendance;
exports.getCumulative10 = getCumulative10;
const stats_admin_service_1 = require("../stats/stats.admin.service");
const client_1 = require("../../prisma/client");
/**
 * 1) Điểm trung bình từng sinh viên trong nhiều section
 * FE dùng cho tab "Điểm trung bình" (GradesTab)
 *
 * Query:
 *    sectionIds=1,2,3  |  subjectIds=4,5
 *    minTotal?=5       |  maxTotal?=8.5
 */
async function getSectionGrades(req, res, next) {
    try {
        // --- Parse ids ---
        let sectionIds = [];
        // Ưu tiên cặp sectionIds/subjectIds để tương thích FE cũ
        const sectionIdsRaw = req.query.sectionIds ? String(req.query.sectionIds) : "";
        const subjectIdsRaw = req.query.subjectIds ? String(req.query.subjectIds) : "";
        if (sectionIdsRaw) {
            sectionIds = sectionIdsRaw.split(",").map(s => Number(s.trim())).filter(Boolean);
        }
        else if (subjectIdsRaw) {
            const subjectIds = subjectIdsRaw.split(",").map(s => Number(s.trim())).filter(Boolean);
            if (!subjectIds.length) {
                return res.status(400).json({ message: "subjectIds required" });
            }
            // map subject -> section
            const secs = await client_1.prisma.courseSection.findMany({
                where: { subjectId: { in: subjectIds } },
                select: { id: true },
            });
            sectionIds = secs.map(s => s.id);
        }
        else {
            // Cho phép kiểu gọi đồng nhất với các API khác: mode + ids
            const mode = String(req.query.mode || "").toLowerCase(); // "section" | "subject" | ...
            const ids = String(req.query.ids || "")
                .split(",")
                .map(s => Number(s.trim()))
                .filter(Boolean);
            if (!ids.length) {
                return res.status(400).json({ message: "sectionIds or subjectIds or (mode+ids) required" });
            }
            sectionIds = await (0, stats_admin_service_1.resolveSectionIds)(mode || "section", ids);
        }
        if (!sectionIds.length) {
            return res.status(400).json({ message: "No sections resolved from input" });
        }
        // --- Parse bộ lọc ---
        const minTotal = req.query.minTotal != null ? Number(req.query.minTotal) : undefined;
        const maxTotal = req.query.maxTotal != null ? Number(req.query.maxTotal) : undefined;
        // --- Lấy dữ liệu & lọc ---
        const rows = await (0, stats_admin_service_1.computeTotalsBySections)(sectionIds);
        const filtered = rows.filter(r => {
            const v = Number(r.total10 ?? 0);
            if (Number.isNaN(v))
                return false;
            if (minTotal != null && v < minTotal)
                return false;
            if (maxTotal != null && v > maxTotal)
                return false;
            return true;
        });
        return res.json({ count: filtered.length, items: filtered });
    }
    catch (err) {
        next(err);
    }
}
/* ... các API getCumulative10, getGradeBuckets, getAttendance giữ nguyên như bạn đã có ... */
/**
 * 2) Phân bố điểm (BucketsTab)
 *
 * Query:
 *    mode = "section" | "subject"
 *    ids  = "1,2,3"
 *    scheme = "vn10" | ...
 */
async function getGradeBuckets(req, res, next) {
    try {
        const mode = String(req.query.mode || "section").toLowerCase();
        const ids = String(req.query.ids || "")
            .split(",")
            .map(s => Number(s.trim()))
            .filter(Boolean);
        if (!ids.length) {
            return res.status(400).json({ message: "ids required" });
        }
        const bucketDefs = (0, stats_admin_service_1.resolveBucketScheme)(String(req.query.scheme));
        // chuyển ids -> list sectionId dựa trên mode
        const sectionIds = await (0, stats_admin_service_1.resolveSectionIds)(mode, ids);
        if (!sectionIds.length) {
            return res.json({
                scheme: "vn10",
                buckets: bucketDefs,
                total: 0,
                series: bucketDefs.map(b => ({ label: b.label, count: 0 })),
            });
        }
        const result = await (0, stats_admin_service_1.computeBucketSeries)(sectionIds, bucketDefs);
        res.json({
            scheme: "vn10",
            buckets: result.buckets,
            total: result.total,
            series: result.series,
        });
    }
    catch (err) {
        next(err);
    }
}
/**
 * 3) Chuyên cần (AttendanceTab)
 *
 * Query:
 *   mode = "section" | "subject"
 *   ids  = "1,2,3"
 *   from (optional ISO)
 *   to   (optional ISO)
 *
 * Response:
 *   { items: [ { sectionId, present, late, excused, absent, total, rate }, ... ] }
 */
async function getAttendance(req, res, next) {
    try {
        const mode = String(req.query.mode || "section").toLowerCase();
        const ids = String(req.query.ids || "")
            .split(",")
            .map(s => Number(s.trim()))
            .filter(Boolean);
        if (!ids.length) {
            return res.status(400).json({ message: "ids required" });
        }
        const from = req.query.from ? new Date(String(req.query.from)) : undefined;
        const to = req.query.to ? new Date(String(req.query.to)) : undefined;
        const sectionIds = await (0, stats_admin_service_1.resolveSectionIds)(mode, ids);
        if (!sectionIds.length) {
            return res.json({ items: [] });
        }
        const items = await (0, stats_admin_service_1.getAttendanceAgg)(sectionIds, from, to);
        // 🔢 Chuẩn hóa total & rate
        const normalized = items.map(row => {
            const present = row.present ?? 0;
            const late = row.late ?? 0;
            const excused = row.excused ?? 0;
            const absent = row.absent ?? 0;
            const total = present + late + excused + absent;
            const attended = present + late + excused;
            // rate (%) làm tròn 2 chữ số
            const rate = total > 0 ? Number(((attended / total) * 100).toFixed(2)) : 0;
            return { ...row, total, rate };
        });
        return res.json({ items: normalized });
    }
    catch (err) {
        next(err);
    }
}
// NEW
async function getCumulative10(req, res, next) {
    try {
        const mode = String(req.query.mode || "section").toLowerCase();
        const ids = String(req.query.ids || "")
            .split(",")
            .map(s => Number(s.trim()))
            .filter(Boolean);
        if (!ids.length) {
            return res.status(400).json({ message: "ids required" });
        }
        const sectionIds = await (0, stats_admin_service_1.resolveSectionIds)(mode, ids);
        if (!sectionIds.length)
            return res.json({ items: [] });
        const items = await (0, stats_admin_service_1.computeCumulative10BySections)(sectionIds);
        // (tùy chọn) lọc theo danh sách studentIds nếu được truyền
        if (req.query.studentIds) {
            const sids = String(req.query.studentIds)
                .split(",")
                .map(s => Number(s.trim()))
                .filter(Boolean);
            return res.json({ items: items.filter(x => sids.includes(x.studentId)) });
        }
        res.json({ items });
    }
    catch (err) {
        next(err);
    }
}
