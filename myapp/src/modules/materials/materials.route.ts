import { Router } from "express";
import upload from "../../middlewares/upload";
import * as controller from "./materials.controller";

const router = Router();

// Upload file thật (tạo mới material, chưa gắn lớp)
router.post("/upload", upload.single("file"), controller.uploadMaterial);

// Gán tài liệu vào lớp
router.post("/assign", controller.assignMaterialToClass);

// Lấy tài liệu theo lớp
router.get("/class/:courseSectionId", controller.getMaterialsByClass);
// Cập nhật mở/đóng tài liệu cho lớp
router.patch("/visibility", controller.updateMaterialVisibility);
router.get("/teacher/:teacherId", controller.getMaterialsByTeacher);

// chỉ lấy tài liệu mở cho SV theo section
router.get("/class/:sectionId/open", controller.listOpenBySection);

// CRUD tài liệu
router.get("/", controller.getMaterials);
router.get("/:id", controller.getMaterial);
router.post("/", controller.createMaterial);
router.put("/:id", controller.updateMaterial);
router.delete("/:id", controller.deleteMaterial);

export default router;
