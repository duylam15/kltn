import { Request, Response } from "express";
import * as service from "./gradeTemplate.service";

// Tạo template mới
export async function createTemplate(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id || req.body.createdBy; // 👈 fallback
        if (!userId) {
            return res
                .status(400)
                .json({ success: false, message: "Missing userId" });
        }

        const data = (req as any).validated.body;

        const template = await service.createTemplate({
            ...data,
            createdBy: userId, // 👈 thêm trường này
        });

        return res.status(201).json({
            success: true,
            message: "Template created successfully",
            data: template,
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// Lấy danh sách templates
export async function listTemplates(req: Request, res: Response) {
    try {
        const { subjectCode, department, isPublic, isActive } = req.query;

        const templates = await service.listTemplates({
            subjectCode: subjectCode as string,
            department: department as string,
            isPublic: isPublic === "true" ? true : undefined,
            isActive: isActive === "false" ? false : true,
        });

        return res.json({
            success: true,
            data: templates,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Lấy chi tiết template
export async function getTemplateById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const template = await service.getTemplateById(id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Template not found",
            });
        }

        return res.json({
            success: true,
            data: template,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Cập nhật template
export async function updateTemplate(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const data = (req as any).validated.body;

        const template = await service.updateTemplate(id, data);

        return res.json({
            success: true,
            message: "Template updated successfully",
            data: template,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Xóa template
export async function deleteTemplate(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        await service.deleteTemplate(id);

        return res.json({
            success: true,
            message: "Template deleted successfully",
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Áp dụng template cho section
export async function applyTemplateToSection(req: Request, res: Response) {
    try {
        const templateId = Number(req.params.id);
        const { sectionId } = (req as any).validated.body;

        const result = await service.applyTemplateToSection(
            templateId,
            sectionId
        );

        return res.json({
            success: true,
            message: "Template applied to section successfully",
            data: result,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
