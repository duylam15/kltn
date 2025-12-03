import { Router } from "express";
import * as controller from "./questionChoice.controller";
import * as validation from "./questionChoice.validation";
import validate from "../../../middlewares/validate";

const router = Router();

// GET /choices/:id
router.get(
    "/choices/:id",
    validate(validation.getChoiceSchema),
    controller.getById
);



// POST /questions/:questionId/choices
router.post(
    "/:questionId/choices",
    validate(validation.createChoiceSchema),
    controller.create
);

// PUT /choices/:id
router.put(
    "/choices/:id",
    validate(validation.updateChoiceSchema),
    controller.update
);

// DELETE /choices/:id
router.delete(
    "/choices/:id",
    validate(validation.deleteChoiceSchema),
    controller.remove
);

export default router;
