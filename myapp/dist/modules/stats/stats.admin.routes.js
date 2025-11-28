"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/stats/stats.admin.routes.ts
const express_1 = require("express");
const stats_admin_controller_1 = require("./stats.admin.controller");
const r = (0, express_1.Router)();
r.get("/grades", stats_admin_controller_1.getSectionGrades);
r.get("/grade-buckets", stats_admin_controller_1.getGradeBuckets);
r.get("/attendance", stats_admin_controller_1.getAttendance);
exports.default = r;
