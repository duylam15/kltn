import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createSectionGroupSchema,
    listSectionGroupQuerySchema,
    sectionGroupIdParamSchema,
    updateSectionGroupSchema,
} from "./sectionGroup.validation";
import * as controller from "./sectionGroup.controller";

const router = Router();

router.post("/", validate(createSectionGroupSchema), controller.create);
router.get("/", validate(listSectionGroupQuerySchema), controller.list);
router.get("/:id", validate(sectionGroupIdParamSchema), controller.detail);
router.patch("/:id", validate(updateSectionGroupSchema), controller.update);
router.delete("/:id", validate(sectionGroupIdParamSchema), controller.remove);
router.get("/sections/:sectionId/groups", controller.listGroupsBySection);
// GET /api/sections/:sectionId/groups/available?studentId=123
router.get(
    "/:sectionId/groups/available",
    controller.getAvailableGroups
);

// POST /api/sections/:sectionId/groups/:groupId/join
router.post(
    "/:sectionId/groups/:groupId/join",
    controller.joinGroup
);

// POST /api/sections/:sectionId/groups/leave
router.post(
    "/:sectionId/groups/leave",
    controller.leaveGroup
);

// GET /api/v1/sections-groups/:sectionId/groups/:groupId/students
router.get("/:sectionId/groups/:groupId/students", controller.getGroupMembers);
export default router;
