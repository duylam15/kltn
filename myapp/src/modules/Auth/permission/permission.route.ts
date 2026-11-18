import { Router } from "express";
import * as permissionController from "./permission.controller";
import { requirePermission } from "../../../middlewares/requirePermission";

const router = Router();

// Tất cả API cần đăng nhập

// tạo permission → cần quyền "permission.create"
router.post(
    "/",
    permissionController.createPermission
);

// xem danh sách → cần quyền "permission.view"
router.get(
    "/",
    permissionController.listPermissions
);

// xem 1 permission
router.get(
    "/:id",
    permissionController.getPermission
);

// update
router.put(
    "/:id",
    permissionController.updatePermission
);

// delete
router.delete(
    "/:id",
    permissionController.deletePermission
);

export default router;
