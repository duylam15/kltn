import { Request, Response } from "express";
import * as service from "./gradeFormula.service";

export const getBySection = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.sectionId);
        const formula = await service.getFormulaBySectionId(sectionId);
        res.json({ success: true, data: formula });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const upsert = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.sectionId);
        const { formula, gradeScale, passingScore } = req.body;

        const result = await service.upsertFormula(sectionId, {
            formula,
            gradeScale,
            passingScore,
        });

        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
