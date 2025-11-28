"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.getRoles = getRoles;
exports.getRoleById = getRoleById;
exports.deleteRole = deleteRole;
const roleService = __importStar(require("./role.service"));
// POST /roles
async function createRole(req, res) {
    try {
        const { name, description, permissions } = req.body;
        const role = await roleService.createRole({
            name,
            description,
            permissions, // mảng permissionId
        });
        return res.json({ success: true, data: role });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
// PUT /roles/:id
async function updateRole(req, res) {
    try {
        const id = Number(req.params.id);
        const { name, description, permissions } = req.body;
        const role = await roleService.updateRole(id, {
            name,
            description,
            permissions,
        });
        return res.json({ success: true, data: role });
    }
    catch (err) {
        if (err.code === "P2002") {
            return res
                .status(400)
                .json({ success: false, message: "Tên role đã tồn tại" });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
}
// GET /roles
async function getRoles(req, res) {
    try {
        const roles = await roleService.getRoles();
        return res.json({ success: true, data: roles });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
// GET /roles/:id
async function getRoleById(req, res) {
    try {
        const id = Number(req.params.id);
        const role = await roleService.getRoleById(id);
        if (!role) {
            return res
                .status(404)
                .json({ success: false, message: "Role not found" });
        }
        return res.json({ success: true, data: role });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
// DELETE /roles/:id
async function deleteRole(req, res) {
    try {
        const id = Number(req.params.id);
        await roleService.deleteRole(id);
        return res.json({
            success: true,
            message: "Role deleted successfully",
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
