import { Router } from "express";
import * as ctl from "./notification.controller";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();
router.use(authenticate);

router.get("/notifications", ctl.list);
router.post("/notifications/mark-read", ctl.markRead);

export default router;
