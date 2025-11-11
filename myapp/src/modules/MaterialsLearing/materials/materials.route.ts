import { Router } from "express";
import * as controller from "./materials.controller";
import upload from "@/middlewares/upload";

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

<<<<<<< HEAD:myapp/src/modules/MaterialsLearing/materials/materials.route.ts
// Lấy danh sách tài liệu công khai(share gv#)
router.get("/public", controller.listPublicMaterialsGrouped);
router.post("/copy", controller.copyMaterial);
=======
// chỉ lấy tài liệu mở cho SV theo section
router.get("/class/:sectionId/open", controller.listOpenBySection);
>>>>>>> locdev:myapp/src/modules/materials/materials.route.ts

// CRUD tài liệu
router.get("/", controller.getMaterials);
router.get("/:id", controller.getMaterial);
router.post("/", controller.createMaterial);
router.put("/:id", controller.updateMaterial);
router.delete("/:id", controller.deleteMaterial);

export default router;
