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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_validation_1 = require("./teacher.validation");
const controller = __importStar(require("./teacher.controller"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
// import { authenticate, requireRole } from '../../middlewares/auth';
const router = (0, express_1.Router)();
// router.use(authenticate);
// router.use(requireRole('admin'));
router.post("/", (0, validate_1.default)(teacher_validation_1.createTeacherSchema), controller.create);
router.get("/", (0, validate_1.default)(teacher_validation_1.listTeacherQuerySchema), controller.list);
router.get("/:id", (0, validate_1.default)(teacher_validation_1.teacherIdParamSchema), controller.detail);
router.patch("/:id", (0, validate_1.default)(teacher_validation_1.updateTeacherSchema), controller.update);
router.delete("/:id", (0, validate_1.default)(teacher_validation_1.teacherIdParamSchema), controller.remove);
router.get("/:teacherId/groups", controller.getAllGroupsOfTeacher);
exports.default = router;
