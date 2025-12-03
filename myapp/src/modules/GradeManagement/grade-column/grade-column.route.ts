import { Router } from "express";
import {
    createGradeColumnSchema,
    listGradeColumnQuerySchema,
    gradeColumnIdParamSchema,
    updateGradeColumnSchema,
    bulkCreateGradeColumnsSchema,
} from "./grade-column.validation";
import * as controller from "./grade-column.controller";
import validate from "../../../middlewares/validate";

const router = Router();

router.post("/", validate(createGradeColumnSchema), controller.create);
router.post(
    "/bulk",
    validate(bulkCreateGradeColumnsSchema),
    controller.bulkCreate
);
router.get("/", validate(listGradeColumnQuerySchema), controller.list);
router.get("/:id", validate(gradeColumnIdParamSchema), controller.detail);
router.patch("/:id", validate(updateGradeColumnSchema), controller.update);
router.delete("/:id", validate(gradeColumnIdParamSchema), controller.remove);

export default router;
