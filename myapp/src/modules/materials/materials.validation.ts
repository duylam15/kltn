import { z } from "zod";

export const createMaterialSchema = z.object({
  body: z.object({
    sectionId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    fileName: z.string().optional(),
    filePath: z.string().optional(),
    fileSize: z.number().optional(),
    fileType: z.string().optional(),
    category: z.enum(["lecture", "slide", "exercise", "reference", "syllabus", "other"]).default("other"),
    isPublic: z.boolean().optional(),
    uploadedBy: z.number(),
  }),
});

export const updateMaterialSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    fileName: z.string().optional(),
    filePath: z.string().optional(),
    fileSize: z.number().optional(),
    fileType: z.string().optional(),
    category: z.enum(["lecture", "slide", "exercise", "reference", "syllabus", "other"]).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const materialIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
  }),
});
