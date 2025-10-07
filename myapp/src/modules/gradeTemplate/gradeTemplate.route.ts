import { Router } from "express";
import * as controller from "./gradeTemplate.controller";
import validate from "../../middlewares/validate";
import * as validation from "./gradeTemplate.validation";

const router = Router();

// CRUD templates
router.post(
    "/",
    validate(validation.createTemplateSchema),
    controller.createTemplate
);

router.get("/", controller.listTemplates);

router.get(
    "/:id",
    validate(validation.getTemplateSchema),
    controller.getTemplateById
);

router.put(
    "/:id",
    validate(validation.updateTemplateSchema),
    controller.updateTemplate
);

router.delete(
    "/:id",
    validate(validation.deleteTemplateSchema),
    controller.deleteTemplate
);

// Áp dụng template
router.post(
    "/:id/apply",
    validate(validation.applyTemplateSchema),
    controller.applyTemplateToSection
);

export default router;
