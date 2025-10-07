import { Router } from "express";
import * as controller from "./gradeFormula.controller";

const router = Router();

router.get("/section/:sectionId", controller.getBySection);
router.put(
    "/section/:sectionId",
    controller.upsert
);

export default router;
