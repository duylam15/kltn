import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = 500;
    let message = "Internal Server Error";

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err?.code === "P2002") {
        statusCode = 409;
        message = `Unique constraint failed on: ${err.meta?.target}`;
    }

    if (process.env.NODE_ENV !== "production") {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
};

export default errorHandler;
