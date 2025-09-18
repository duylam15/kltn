import { Router } from "express";
import userRoute from "../modules/user/user.route";
import studentRoute from "../modules/student/student.route";
import teacherRoute from "../modules/teacher/teacher.route";
import subjectRoute from "../modules/subject/subject.route";
import sectionEnrollmentRoute from "../modules/sectionEnrollment/sectionEnrollment.route";
import termRoute from "../modules/term/term.route";
import courseSectionRoute from "../modules/courseSection/courseSection.route";
import sectionInstructorRoute from "../modules/sectionInstructor/sectionInstructor.route";
import sectionGroupRoute from "../modules/sectionGroup/sectionGroup.route";
import materialRoute from "../modules/materials/materials.route"; // 👈 thêm import

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/users", userRoute);
router.use("/students", studentRoute);
router.use("/teachers", teacherRoute);
router.use("/subjects", subjectRoute);
router.use("/terms", termRoute);
router.use("/course-sections", courseSectionRoute);
router.use("/sections-instructors", sectionInstructorRoute);
router.use("/sections-groups", sectionGroupRoute);
router.use("/sections-enrollments", sectionEnrollmentRoute);
router.use("/materials", materialRoute); // 👈 thêm vào đây

export default router;
