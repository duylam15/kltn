import { prisma } from "../../prisma/client";

export const getFormulaBySectionId = async (sectionId: number) => {
    return prisma.gradeFormula.findUnique({
        where: { sectionId },
    });
};

export const upsertFormula = async (
    sectionId: number,
    data: {
        formula: any;
        gradeScale?: any;
        passingScore?: number;
    }
) => {
    return prisma.gradeFormula.upsert({
        where: { sectionId },
        create: {
            sectionId,
            formula: data.formula,
            gradeScale: data.gradeScale,
            passingScore: data.passingScore ?? 5.0,
        },
        update: {
            formula: data.formula,
            gradeScale: data.gradeScale,
            passingScore: data.passingScore,
        },
    });
};
