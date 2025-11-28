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
const sectionInstructor_validation_1 = require("./sectionInstructor.validation");
const controller = __importStar(require("./sectionInstructor.controller"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const requireAuth_1 = require("../../../middlewares/requireAuth");
const router = (0, express_1.Router)();
router.post("/", (0, validate_1.default)(sectionInstructor_validation_1.createSectionInstructorSchema), controller.create);
router.get("/", (0, validate_1.default)(sectionInstructor_validation_1.listSectionInstructorQuerySchema), controller.list);
router.get("/:sectionId/:teacherId", (0, validate_1.default)(sectionInstructor_validation_1.sectionInstructorParamSchema), controller.detail);
router.patch("/:sectionId/:teacherId", (0, validate_1.default)(sectionInstructor_validation_1.updateSectionInstructorSchema), controller.update);
router.delete("/:sectionId/:teacherId", (0, validate_1.default)(sectionInstructor_validation_1.sectionInstructorParamSchema), controller.remove);
router.get("/section/:sectionId/teacher", requireAuth_1.requireAuth, controller.getTeacherBySection);
exports.default = router;
