import { Request, Response } from "express";
import * as service from "./questions.service";

// question.controller.ts
export async function create(req: Request, res: Response) {
  try {
    const { body } = (req as any).validated;

    const question = await service.createQuestion(body);

    res.json({ success: true, data: question });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}


export async function getAllQuestions(req: Request, res: Response) {
    const data = await service.getAllQuestions((req as any).validated.query);
    res.json({ success: true, data });
}

export async function update(req: Request, res: Response) {
    const { body, params } = (req as any).validated;
    const question = await service.updateQuestion(Number(params.id), body);
    res.json({ success: true, data: question });
}

export async function remove(req: Request, res: Response) {
    const { params } = (req as any).validated;
    await service.deleteQuestion(Number(params.id));
    res.json({ success: true });
}


export async function getById(req: Request, res: Response) {
    const { params } = (req as any).validated;
    const data = await service.getQuestionById(Number(params.id));
    res.json({ success: true, data });
}
