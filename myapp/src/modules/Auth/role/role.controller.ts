import { Request, Response } from "express";
import * as roleService from "./role.service";

// POST /roles
export async function createRole(req: Request, res: Response) {
    try {
        const { name, description, permissions } = req.body;

        const role = await roleService.createRole({
            name,
            description,
            permissions, // mảng permissionId
        });

        return res.json({ success: true, data: role });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

// PUT /roles/:id
export async function updateRole(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const { name, description, permissions } = req.body;

        const role = await roleService.updateRole(id, {
            name,
            description,
            permissions,
        });
        return res.json({ success: true, data: role });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res
                .status(400)
                .json({ success: false, message: "Tên role đã tồn tại" });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
}


// GET /roles
export async function getRoles(req: Request, res: Response) {
    try {
        const roles = await roleService.getRoles();
        return res.json({ success: true, data: roles });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

// GET /roles/:id
export async function getRoleById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        const role = await roleService.getRoleById(id);

        if (!role) {
            return res
                .status(404)
                .json({ success: false, message: "Role not found" });
        }

        return res.json({ success: true, data: role });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

// DELETE /roles/:id
export async function deleteRole(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        await roleService.deleteRole(id);

        return res.json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
