import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../../utils/response";
import { catchAsync } from "../../utils/catchAsync";
import * as userService from "./user.service";
import ApiError from "../../utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    // map lại field từ client nếu vẫn gửi full_name:
    const mapped = {
        email: req.body.email,
        password: req.body.password,
        fullName: req.body.full_name ?? req.body.fullName,
        roleName: req.body.role_name ?? req.body.roleName,
        avatarUrl: req.body.avatar_url ?? req.body.avatarUrl,
        phone: req.body.phone,
        dateOfBirth: req.body.date_of_birth ?? req.body.dateOfBirth,
        address: req.body.address,
    };
    const user = await userService.createUser(mapped);
    sendResponse(
        res,
        {
            success: true,
            message: "User created",
            data: { id: user.id, email: user.email },
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { role, active, q } = req.query as any;

    const result = await userService.listUsers({
        page,
        limit,
        role,
        active,
        q,
    });

    sendResponse(res, {
        success: true,
        data: result.items.map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role?.name,
            isActive: u.isActive,
            createdAt: u.createdAt,
        })),
        meta: { page, limit, total: result.total },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const user = await userService.getUser(id);
        if (!user) return next(new ApiError(404, "User not found"));

        sendResponse(res, {
            success: true,
            data: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role?.name,
                isActive: user.isActive,
                student: user.student,
                teacher: user.teacher,
            },
        });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const existing = await userService.getUser(id);
        if (!existing) return next(new ApiError(404, "User not found"));

        const mapped = {
            fullName: req.body.full_name ?? req.body.fullName,
            avatarUrl: req.body.avatar_url ?? req.body.avatarUrl,
            phone: req.body.phone,
            dateOfBirth: req.body.date_of_birth ?? req.body.dateOfBirth,
            address: req.body.address,
            isActive:
                typeof req.body.is_active === "boolean"
                    ? req.body.is_active
                    : req.body.isActive,
        };

        const updated = await userService.updateUser(id, mapped);

        sendResponse(res, {
            success: true,
            message: "User updated",
            data: {
                id: updated.id,
                email: updated.email,
                fullName: updated.fullName,
            },
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const existing = await userService.getUser(id);
        if (!existing) return next(new ApiError(404, "User not found"));

        await userService.deleteUser(id);
        sendResponse(res, { success: true, message: "User deleted" });
    }
);
