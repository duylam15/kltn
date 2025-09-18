import { Response } from "express";

interface IResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: any;
}

export const sendResponse = <T>(
    res: Response,
    payload: IResponse<T>,
    statusCode = 200
) => {
    res.status(statusCode).json({
        success: payload.success,
        message: payload.message,
        data: payload.data,
        meta: payload.meta,
    });
};
