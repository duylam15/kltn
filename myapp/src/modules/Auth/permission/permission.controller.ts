import { Request, Response } from "express";
import * as permissionService from "./permission.service";

export async function createPermission(req: Request, res: Response) {
  try {
    const { name, description } = req.body;
    const perm = await permissionService.createPermission({ name, description });
    res.json({ success: true, data: perm });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function listPermissions(req: Request, res: Response) {
  try {
    const perms = await permissionService.listPermissions();
    res.json({ success: true, data: perms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPermission(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const perm = await permissionService.getPermissionById(id);
    if (!perm) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: perm });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updatePermission(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;
    const perm = await permissionService.updatePermission(id, { name, description });
    res.json({ success: true, data: perm });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deletePermission(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await permissionService.deletePermission(id);
    res.json({ success: true, message: "Permission deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
