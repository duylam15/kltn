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
const express_1 = require("express");
const validate_1 = require("../../../middlewares/validate");
const sectionGroup_validation_1 = require("./sectionGroup.validation");
const controller = __importStar(require("./sectionGroup.controller"));
const router = (0, express_1.Router)();
router.post("/", (0, validate_1.validate)(sectionGroup_validation_1.createSectionGroupSchema), controller.create);
router.get("/", (0, validate_1.validate)(sectionGroup_validation_1.listSectionGroupQuerySchema), controller.list);
router.get("/:id", (0, validate_1.validate)(sectionGroup_validation_1.sectionGroupIdParamSchema), controller.detail);
router.patch("/:id", (0, validate_1.validate)(sectionGroup_validation_1.updateSectionGroupSchema), controller.update);
router.delete("/:id", (0, validate_1.validate)(sectionGroup_validation_1.sectionGroupIdParamSchema), controller.remove);
router.get("/sections/:sectionId/groups", controller.listGroupsBySection);
// GET /api/sections/:sectionId/groups/available?studentId=123
router.get("/:sectionId/groups/available", controller.getAvailableGroups);
// POST /api/sections/:sectionId/groups/:groupId/join
router.post("/:sectionId/groups/:groupId/join", controller.joinGroup);
// POST /api/sections/:sectionId/groups/leave
router.post("/:sectionId/groups/leave", controller.leaveGroup);
// GET /api/v1/sections-groups/:sectionId/groups/:groupId/students
router.get("/:sectionId/groups/:groupId/students", controller.getGroupMembers);
exports.default = router;
