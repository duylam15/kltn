import { Router } from "express";
import * as permissionController from "./permission.controller";

const router = Router();

router.post("/", permissionController.createPermission);
router.get("/", permissionController.listPermissions);
router.get("/:id", permissionController.getPermission);
router.put("/:id", permissionController.updatePermission);
router.delete("/:id", permissionController.deletePermission);

export default router;
