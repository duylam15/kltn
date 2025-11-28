"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const errorHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    if (err instanceof ApiError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err?.code === "P2002") {
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
exports.default = errorHandler;
