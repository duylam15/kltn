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
exports.remove = exports.update = exports.getById = exports.getBySection = exports.create = void 0;
const service = __importStar(require("./attendanceSession.service"));
const create = async (req, res) => {
    const { sectionId, expiresAt } = req.body;
    const session = await service.createSession({ sectionId, expiresAt });
    res.json({ success: true, data: session });
};
exports.create = create;
const getBySection = async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    const sessions = await service.getSessionsBySection(sectionId);
    res.json({ success: true, data: sessions });
};
exports.getBySection = getBySection;
const getById = async (req, res) => {
    const id = Number(req.params.id);
    const session = await service.getSessionById(id);
    res.json({ success: true, data: session });
};
exports.getById = getById;
const update = async (req, res) => {
    const id = Number(req.params.id);
    const session = await service.updateSession(id, req.body);
    res.json({ success: true, data: session });
};
exports.update = update;
const remove = async (req, res) => {
    const id = Number(req.params.id);
    await service.deleteSession(id);
    res.json({ success: true, message: "Xóa thành công" });
};
exports.remove = remove;
