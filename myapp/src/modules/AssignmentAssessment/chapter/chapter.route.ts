import { Router } from "express";
import * as controller from "./chapter.controller";
import validate from "../../../middlewares/validate";
import {
    createChapterSchema,
    listChapterQuerySchema,
    chapterIdParamSchema,
    updateChapterSchema,
} from "./chapter.validation";

const router = Router();

router.post("/", validate(createChapterSchema), controller.create);
router.get("/", validate(listChapterQuerySchema), controller.list);
router.get("/:id", validate(chapterIdParamSchema), controller.detail);
router.get(
    "/:id/questions",
    validate(chapterIdParamSchema),
    controller.getQuestions
);
router.get(
    "/:id/questions/stats",
    validate(chapterIdParamSchema),
    controller.getStats
);
router.patch("/:id", validate(updateChapterSchema), controller.update);
router.delete("/:id", validate(chapterIdParamSchema), controller.remove);

export default router;
