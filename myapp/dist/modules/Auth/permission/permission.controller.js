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
exports.createPermission = createPermission;
exports.listPermissions = listPermissions;
exports.getPermission = getPermission;
exports.updatePermission = updatePermission;
exports.deletePermission = deletePermission;
const permissionService = __importStar(require("./permission.service"));
async function createPermission(req, res) {
    try {
        const { name, description } = req.body;
        const perm = await permissionService.createPermission({ name, description });
        res.json({ success: true, data: perm });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function listPermissions(req, res) {
    try {
        const perms = await permissionService.listPermissions();
        res.json({ success: true, data: perms });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function getPermission(req, res) {
    try {
        const id = Number(req.params.id);
        const perm = await permissionService.getPermissionById(id);
        if (!perm)
            return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: perm });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function updatePermission(req, res) {
    try {
        const id = Number(req.params.id);
        const { name, description } = req.body;
        const perm = await permissionService.updatePermission(id, { name, description });
        res.json({ success: true, data: perm });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function deletePermission(req, res) {
    try {
        const id = Number(req.params.id);
        await permissionService.deletePermission(id);
        res.json({ success: true, message: "Permission deleted" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
