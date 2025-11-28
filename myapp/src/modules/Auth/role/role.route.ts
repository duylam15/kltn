import { Router } from "express";
import * as roleController from "./role.controller";

const router = Router();

// CRUD cho Role
router.post("/", roleController.createRole);
router.get("/", roleController.getRoles);
router.get("/:id", roleController.getRoleById);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

// Optional: endpoints thao tác trực tiếp với permissions của role
router.get("/:id/permissions", roleController.getRoleById); // lấy kèm permissions
// Nếu muốn assign riêng permissions thì thêm 1 endpoint custom:
router.post("/:id/permissions", roleController.updateRole) ;
// (truyền body { permissions: [1,2,3] } sẽ chỉ cập nhật permissions)

export default router;
