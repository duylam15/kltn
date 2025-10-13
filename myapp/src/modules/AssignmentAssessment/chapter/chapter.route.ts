import { Router } from "express";
import {
    createChapterSchema,
    listChapterQuerySchema,
    chapterIdParamSchema,
    updateChapterSchema,
    getQuestionsByDifficultySchema,
} from "./chapter.validation";
import * as controller from "./chapter.controller";
import validate from "@/middlewares/validate";

const router = Router();

router.post("/", validate(createChapterSchema), controller.create);
router.get("/", validate(listChapterQuerySchema), controller.list);
router.get("/:id", validate(chapterIdParamSchema), controller.detail);
router.patch("/:id", validate(updateChapterSchema), controller.update);
router.delete("/:id", validate(chapterIdParamSchema), controller.remove);

// 🆕 API lấy thống kê số câu hỏi theo độ khó
router.get(
    "/:id/questions/stats",
    validate(chapterIdParamSchema),
    controller.getQuestionStats
);

// 🆕 API lấy câu hỏi theo độ khó
router.get(
    "/:id/questions",
    validate(getQuestionsByDifficultySchema),
    controller.getQuestionsByDifficulty
);

export default router;
