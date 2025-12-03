import { Router } from "express";
import validate from "../../../middlewares/validate";
import * as validation from "./assignment.validation";
import * as controller from "./assignment.controller";
import {
    getAssignmentWithBestSubmissions,
    getPublicAssignments,
    getSubmissionsByStudentAndAssignment,
} from "./assignment.service";
const router = Router();

router.get(
    "/:assignmentId/student/:studentId/submissions",
    async (req, res) => {
        try {
            const assignmentId = Number(req.params.assignmentId);
            const studentId = Number(req.params.studentId);

            if (isNaN(assignmentId) || isNaN(studentId)) {
                return res
                    .status(400)
                    .json({ success: false, message: "ID không hợp lệ" });
            }

            const submissions = await getSubmissionsByStudentAndAssignment(
                studentId,
                assignmentId
            );
            res.json({ success: true, data: submissions });
        } catch (error) {
            console.error("Error fetching submissions:", error);
            res.status(500).json({ success: false, message: "Lỗi server" });
        }
    }
);
router.get("/public", async (req, res) => {
    try {
        const data = await getPublicAssignments();
        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// Admin/Teacher
router.post(
    "/",
    validate(validation.createAssignmentSchema),
    controller.create
);
router.put(
    "/:id",
    validate(validation.updateAssignmentSchema),
    controller.update
);
router.delete(
    "/:id",
    validate(validation.deleteAssignmentSchema),
    controller.remove
);
router.get("/", validate(validation.listAssignmentsSchema), controller.list);
router.get(
    "/:id",
    validate(validation.getAssignmentByIdSchema),
    controller.getById
);

router.get("/:id/best-submissions", controller.getBestSubmissions);

router.get(
    "/:id/submissions",
    validate(validation.listSubmissionsByAssignmentSchema),
    controller.submissions
);

router.get("/teacher/:teacherId", controller.getAssignmentsByTeacher);
router.get("/sections/:sectionId/assignments", controller.bySection);

// Student Routes
router.get(
    "/section/:sectionId/student/:studentId",
    controller.getAssignmentsBySectionForStudent
); 

router.post("/:id/start", controller.start);

router.post(
    "/:id/submit",
    controller.submit
);

// Student submit code (single file)
router.post(
  "/:id/submit-code",
  controller.submitCode
);

// Student submit folder (zip)
router.post(
  "/:id/submit-project",
  controller.submitProject
);

// Get answer status
router.get(
  "/answer/:answerId/status",
  controller.getAnswerStatus
);

// Gợi ý lộ trình học tập sau khi làm xong assignment
router.post(
  "/:id/recommend-path",
  controller.recommendPath
);

router.get("/suggest/cluster", controller.clusterStudents);
router.get("/answers/:answerId/result", controller.getAnswerResult);

export default router;

