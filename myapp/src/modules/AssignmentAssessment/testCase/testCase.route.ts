import { Router } from "express";
import * as controller from "./testCase.controller";
import validate from "@/middlewares/validate";
import {
    createTestCaseSchema,
    listTestCaseQuerySchema,
    testCaseIdParamSchema,
    updateTestCaseSchema,
} from "./testCase.validation";

const router = Router();

router.post("/", validate(createTestCaseSchema), controller.create);
router.get("/", validate(listTestCaseQuerySchema), controller.list);
router.get("/:id", validate(testCaseIdParamSchema), controller.detail);
router.patch("/:id", validate(updateTestCaseSchema), controller.update);
router.delete("/:id", validate(testCaseIdParamSchema), controller.remove);


router.get("/question/:questionId", controller.listByQuestion);
router.get("/question/:questionId/public", controller.listPublicByQuestion);
router.get(
    "/question/:questionId/total-points",
    controller.getTotalPointsController
);

export default router;
