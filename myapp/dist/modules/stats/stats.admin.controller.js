"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSectionGrades = getSectionGrades;
exports.getGradeBuckets = getGradeBuckets;
exports.getAttendance = getAttendance;
const client_1 = require("../../prisma/client");
const stats_admin_service_1 = require("./stats.admin.service");
async function getSectionGrades(req, res, next) {
    try {
        const sectionIds = String(req.query.sectionIds || "")
            .split(",").map(s => Number(s.trim())).filter(Boolean);
        if (!sectionIds.length)
            return res.status(400).json({ message: "sectionIds required" });
        const rows = await (0, stats_admin_service_1.computeTotalsBySections)(sectionIds);
        res.json({ count: rows.length, items: rows });
    }
    catch (e) {
        next(e);
    }
}
async function getGradeBuckets(req, res, next) {
    try {
        const mode = String(req.query.mode || "section");
        const ids = String(req.query.ids || "").split(",").map(s => Number(s.trim())).filter(Boolean);
        const schemeKey = String(req.query.scheme || "vn10");
        const scheme = stats_admin_service_1.bucketSchemes[schemeKey] || stats_admin_service_1.bucketSchemes.vn10;
        if (!ids.length)
            return res.status(400).json({ message: "ids required" });
        let sectionIds = [];
        if (mode === "section") {
            sectionIds = ids;
        }
        else if (mode === "subject" || mode === "course") {
            // “course” ở đây hiểu là “subject”
            const secs = await client_1.prisma.courseSection.findMany({
                where: { subjectId: { in: ids } },
                select: { id: true }
            });
            sectionIds = secs.map(s => s.id);
        }
        else {
            return res.status(400).json({ message: "mode must be 'section' or 'subject|course'" });
        }
        const totals = await (0, stats_admin_service_1.computeTotalsBySections)(sectionIds);
        const series = scheme.map(b => ({
            label: b.label,
            count: totals.filter(t => t.total10 >= b.from && t.total10 < b.to).length
        }));
        res.json({ scheme: schemeKey, buckets: scheme, total: totals.length, series });
    }
    catch (e) {
        next(e);
    }
}
async function getAttendance(req, res, next) {
    try {
        const mode = String(req.query.mode || "section");
        const ids = String(req.query.ids || "").split(",").map(s => Number(s.trim())).filter(Boolean);
        const from = req.query.from ? new Date(String(req.query.from)) : undefined;
        const to = req.query.to ? new Date(String(req.query.to)) : undefined;
        if (!ids.length)
            return res.status(400).json({ message: "ids required" });
        let sectionIds = [];
        if (mode === "section") {
            sectionIds = ids;
        }
        else if (mode === "subject" || mode === "course") {
            const secs = await client_1.prisma.courseSection.findMany({
                where: { subjectId: { in: ids } },
                select: { id: true }
            });
            sectionIds = secs.map(s => s.id);
        }
        else {
            return res.status(400).json({ message: "mode must be 'section' or 'subject|course'" });
        }
        const items = await (0, stats_admin_service_1.getAttendanceAgg)(sectionIds, from, to);
        res.json({ items });
    }
    catch (e) {
        next(e);
    }
}
