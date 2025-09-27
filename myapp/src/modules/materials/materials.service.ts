import { prisma } from "../../prisma/client";

// Lấy tất cả tài liệu
export async function getAllMaterials() {
  return prisma.material.findMany({
    include: { uploader: true }, // nếu muốn lấy thông tin người upload
    orderBy: { uploadedAt: "desc" },
  });
}

// Lấy 1 tài liệu
export async function getMaterialById(id: number) {
  return prisma.material.findUnique({
    where: { id },
    include: { uploader: true },
  });
}

// Tạo tài liệu
export async function createMaterial(data: any) {
  return prisma.material.create({ data });
}

// Cập nhật tài liệu
export async function updateMaterial(id: number, data: any) {
  return prisma.material.update({
    where: { id },
    data,
  });
}

// Xóa tài liệu
export async function deleteMaterial(id: number) {
  return prisma.material.delete({ where: { id } });
}

// Gán tài liệu vào lớp
export async function assignMaterialToClass(courseSectionId: number, materialId: number) {
  return prisma.courseMaterial.create({
    data: {
      courseSectionId,
      materialId,
    },
  });
}

// Lấy tài liệu theo lớp
export async function getMaterialsByClass(courseSectionId: number) {
  return prisma.courseMaterial.findMany({
    where: { courseSectionId },
    include: {
      material: true,
    },
  });
}

// Cập nhật isOpen cho tài liệu trong lớp
export async function toggleMaterialVisibility(courseSectionId: number, materialId: number, isOpen: boolean) {
  return prisma.courseMaterial.update({
    where: {
      courseSectionId_materialId: { // composite unique
        courseSectionId,
        materialId,
      },
    },
    data: { isOpen },
  });
}
