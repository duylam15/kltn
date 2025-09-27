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
import authRoutes from "../modules/auth/auth.routes";
import materialRoutes from "../modules/materials/materials.route";
import attendanceRoute from "../modules/attendance/attendance.route";
import roleRoute from "../modules/role/role.route";
import permissionRoute from "../modules/permission/permission.route";


const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));
router.use("/auths", authRoutes);
router.use("/users", userRoute);
router.use("/students", studentRoute);
router.use("/teachers", teacherRoute);
router.use("/subjects", subjectRoute);
router.use("/terms", termRoute);
router.use("/course-sections", courseSectionRoute);
router.use("/sections-instructors", sectionInstructorRoute);
router.use("/sections-groups", sectionGroupRoute);
router.use("/sections-enrollments", sectionEnrollmentRoute);
router.use("/materials", materialRoutes);
router.use("/attendance", attendanceRoute);
router.use("/roles", roleRoute);
router.use("/permissions", permissionRoute);


export default router;
