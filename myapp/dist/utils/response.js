"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, payload, statusCode = 200) => {
    res.status(statusCode).json({
        success: payload.success,
        message: payload.message,
        data: payload.data,
        meta: payload.meta,
    });
};
exports.sendResponse = sendResponse;
