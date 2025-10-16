// src/modules/stats/stats.admin.routes.ts
import { Router } from "express";
import { getSectionGrades, getGradeBuckets, getAttendance } from "./stats.admin.controller";

const r = Router();
r.get("/grades", getSectionGrades);
r.get("/grade-buckets", getGradeBuckets);
r.get("/attendance", getAttendance);
export default r;
