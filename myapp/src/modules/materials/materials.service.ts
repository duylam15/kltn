import { prisma } from "../../prisma/client";

export async function createMaterial(data: any) {
    return prisma.material.create({
        data: {
            sectionId: Number(data.sectionId),
            title: data.title,
            description: data.description,
            fileName: data.fileName,
            filePath: data.filePath,
            fileSize: data.fileSize,
            fileType: data.fileType,
            uploadedBy: Number(data.uploadedBy),
        },
    });

}


export async function listMaterialsBySection(sectionId: number) {
  return prisma.material.findMany({
    where: { sectionId },
    include: { uploader: { select: { id: true, fullName: true, email: true } } },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function getMaterial(id: number) {
  return prisma.material.findUnique({
    where: { id },
    include: { uploader: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function updateMaterial(id: number, data: any) {
  return prisma.material.update({ where: { id }, data });
}

export async function deleteMaterial(id: number) {
  return prisma.material.delete({ where: { id } });
}

export async function incrementDownloadCount(id: number) {
  return prisma.material.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });
}
