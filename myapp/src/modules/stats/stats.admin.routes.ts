// src/modules/stats/stats.routes.ts
import { Router } from "express";
import {
  getSectionGrades,
  getGradeBuckets,
  getAttendance,
} from "./stats.admin.controller";

const router = Router();

// Điểm trung bình theo sectionIds
router.get("/grades", getSectionGrades);

// Phân bố điểm (bucket chart)
router.get("/grade-buckets", getGradeBuckets);

// Chuyên cần
router.get("/attendance", getAttendance);

export default router;
