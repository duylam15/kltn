import { Router } from "express";
import { validate } from "../../middlewares/validate";

import {
  createMaterialSchema,
  updateMaterialSchema,
  materialIdParamSchema,
} from "./materials.validation";
import * as controller from "./materials.controller";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), controller.createMaterialController);

router.get("/section/:sectionId", controller.listBySection);
router.get("/:id", validate(materialIdParamSchema), controller.detail);
router.patch("/:id", validate(updateMaterialSchema), controller.update);
router.delete("/:id", validate(materialIdParamSchema), controller.remove);
router.patch("/:id/download", controller.incrementDownload);
// src/modules/materials/materials.route.ts

export default router;
