// src/modules/stats/stats.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  computeTotalsBySections,
  resolveBucketScheme,
  computeBucketSeries,
  resolveSectionIds,
  getAttendanceAgg,
} from "../stats/stats.admin.service";
import { prisma } from "../../prisma/client";

/**
 * 1) Điểm trung bình từng sinh viên trong nhiều section
 * FE dùng cho tab "Điểm trung bình" (GradesTab)
 *
 * Query:
 *    sectionIds=1,2,3
 *
 * Response:
 *    { count, items: TotalRow[] }
 */
export async function getSectionGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const sectionIds = String(req.query.sectionIds || "")
      .split(",")
      .map(s => Number(s.trim()))
      .filter(Boolean);

    if (!sectionIds.length) {
      return res.status(400).json({ message: "sectionIds required" });
    }

    const rows = await computeTotalsBySections(sectionIds);
    res.json({ count: rows.length, items: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * 2) Phân bố điểm (BucketsTab)
 *
 * Query:
 *    mode = "section" | "subject"
 *    ids  = "1,2,3"
 *    scheme = "0-10" | "5-6.5" | ... (FE gửi gì cũng được, ta map về default)
 *
 * Response:
 *    {
 *      scheme: "vn10",
 *      buckets: [{label,from,to}, ...],
 *      total: <tổng số SV>,
 *      series: [{label,count}, ...]
 *    }
 *
 * FE dùng để vẽ cột “<5 / 5-6.5 / …”
 */
export async function getGradeBuckets(req: Request, res: Response, next: NextFunction) {
  try {
    const mode = String(req.query.mode || "section").toLowerCase();
    const ids = String(req.query.ids || "")
      .split(",")
      .map(s => Number(s.trim()))
      .filter(Boolean);

    if (!ids.length) {
      return res.status(400).json({ message: "ids required" });
    }

    const bucketDefs = resolveBucketScheme(String(req.query.scheme));

    // chuyển ids -> list sectionId dựa trên mode
    const sectionIds = await resolveSectionIds(mode, ids);
    if (!sectionIds.length) {
      return res.json({
        scheme: "vn10",
        buckets: bucketDefs,
        total: 0,
        series: bucketDefs.map(b => ({ label: b.label, count: 0 })),
      });
    }

    const result = await computeBucketSeries(sectionIds, bucketDefs);

    res.json({
      scheme: "vn10",
      buckets: result.buckets,
      total: result.total,
      series: result.series,
    });
  } catch (err) {
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
 *
 * FE sẽ map sang bảng + line chart.
 */
export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const mode = String(req.query.mode || "section").toLowerCase();
    const ids = String(req.query.ids || "")
      .split(",")
      .map(s => Number(s.trim()))
      .filter(Boolean);

    if (!ids.length) {
      return res.status(400).json({ message: "ids required" });
    }

    // optional thời gian
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to   = req.query.to   ? new Date(String(req.query.to))   : undefined;

    // resolve sectionIds theo mode
    const sectionIds = await resolveSectionIds(mode, ids);
    if (!sectionIds.length) {
      return res.json({ items: [] });
    }

    const items = await getAttendanceAgg(sectionIds, from, to);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

/**
 * (Không bắt FE dùng endpoint riêng cho DepartmentTab)
 *
 * DepartmentTab FE đã tự lọc:
 *  - Chọn termId / subjectIds
 *  - Lọc section ở FE (từ catalog.sections)
 *  - Gọi /stats/grades và /stats/attendance với sectionIds đó
 *
 * => Các API trên đã đủ cho DepartmentTab.
 */
