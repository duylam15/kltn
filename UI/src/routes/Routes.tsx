import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import LayoutDefault from "../layouts/LayoutDefault";
import LayoutTeacher from "../layouts/LayoutTeacher";
import LayoutAdmin from "../layouts/LayoutTeacher";

// Auth
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";

// Student pages
import Dashboard from "../pages/Student/Dashboard";
import Courses from "../pages/Student/Courses";
// import CourseDetail from "../pages/Student/CourseDetail";
// import Assignments from "../pages/Student/Assignments";
// import AssignmentDetail from "../pages/Student/AssignmentDetail";
// import Exams from "../pages/Student/Exams";
// import Documents from "../pages/Student/Documents"; // Materials
// import Forum from "../pages/Student/Forum"; // Q&A
// import Attendance from "../pages/Student/Attendance";
// import Grades from "../pages/Student/Grades";
// import Notifications from "../pages/Student/Notifications";
// import StudyPath from "../pages/Student/StudyPath"; // Recommendations
// import Statistics from "../pages/Student/Statistics"; // Analytics
// import Calendar from "../pages/Student/Calendar";
// import Profile from "../pages/Student/Profile";

// Teacher pages
// import TeacherDashboard from "../pages/Teacher/Dashboard";
// import ClassManagement from "../pages/Teacher/ClassManagement";
// import TeacherAssignments from "../pages/Teacher/Assignments";
// import Grading from "../pages/Teacher/Grading";
// import TeacherDocuments from "../pages/Teacher/Documents";
// import StudentProgress from "../pages/Teacher/StudentProgress";
// import TeacherReports from "../pages/Teacher/Reports";
// import TeacherProfile from "../pages/Teacher/Profile";
// import TeacherQA from "../pages/Teacher/QA";
// import TeacherAnnouncements from "../pages/Teacher/Announcements";
// import TeacherAnalytics from "../pages/Teacher/Analytics";
// import TeacherCalendar from "../pages/Teacher/Calendar";

// // Admin pages
// import AdminDashboard from "../pages/Admin/Dashboard";
// import UserManagement from "../pages/Admin/UserManagement";
// import CourseManagement from "../pages/Admin/CourseManagement";
// import SystemSettings from "../pages/Admin/SystemSettings";
// import AdminReports from "../pages/Admin/Reports";
// import AdminProfile from "../pages/Admin/Profile";
// import RoleManagement from "../pages/Admin/RoleManagement";

// Route guards
import PublicRoute from "./PublicRoute";
import StudentRoute from "./StudentRoute";
import TeacherRoute from "./TeacherRoute";
import AdminRoute from "./AdminRoute";
import Error from "./Error";
import CourseDetail from "../pages/Student/CourseDetail";
import Overview from "../pages/Student/Overview";
import CourseLayout from "../layouts/CourseLayout";
import Friend from "../pages/Student/Friend";

export const router = createBrowserRouter([
  // Redirect root -> /student
  { path: "/", element: <Navigate to="/student" replace /> },

  // Public routes
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },

  // =======================
  // Student routes
  // =======================
  {
    path: "/student",
    element: <LayoutDefault />,
    errorElement: <Error />,
    children: [
      { index: true, element: <Dashboard /> },

      // Danh sách học phần
      { path: "courses", element: <Courses /> },

      // Layout trang môn học + các tab con
      {
        path: "courses/:courseId",
        element: <CourseLayout />,               // ⬅️ dùng layout thay cho CourseDetail
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: "overview", element: <Overview /> },
          { path: "friend", element: <Friend /> },
          // { path: "materials", element: <Documents /> },
          // { path: "assignments", element: <Assignments /> },
          // { path: "exams", element: <Exams /> },
          // { path: "grades", element: <Grades /> },
          // { path: "qa", element: <Forum /> },
          // { path: "schedule", element: <Attendance /> }, // lịch & điểm danh
        ],
      },


      // Trung tâm tác vụ
      // { path: "assignments", element: <Assignments /> },
      // { path: "assignments/:assignmentId", element: <AssignmentDetail /> },
      // { path: "exams", element: <Exams /> },
      // { path: "materials", element: <Documents /> },
      // { path: "qa", element: <Forum /> },
      // { path: "calendar", element: <Calendar /> },
      // { path: "analytics", element: <Statistics /> },
      // { path: "recommendations", element: <StudyPath /> },
      // { path: "notifications", element: <Notifications /> },
      // { path: "profile", element: <Profile /> },

      // Redirect legacy slugs (nếu có code cũ)
      { path: "documents", element: <Navigate to="../student/materials" replace /> },
      { path: "forum", element: <Navigate to="../student/qa" replace /> },
      { path: "study-path", element: <Navigate to="../student/recommendations" replace /> },
      { path: "statistics", element: <Navigate to="../student/analytics" replace /> },
      { path: "attendance", element: <Navigate to="../student/calendar" replace /> },
      { path: "grades", element: <Navigate to="../student/analytics" replace /> },
    ],
  },

  // =======================
  // Teacher routes
  // =======================
  // {
  //   path: "/teacher",
  //   element: (
  //     <TeacherRoute>
  //       <LayoutTeacher />
  //     </TeacherRoute>
  //   ),
  //   errorElement: <Error />,
  //   children: [
  //     { index: true, element: <TeacherDashboard /> },

  //     // Lớp học
  //     { path: "classes", element: <ClassManagement /> },
  //     {
  //       path: "classes/:classId",
  //       element: <ClassManagement />,
  //       children: [
  //         { index: true, element: <Navigate to="overview" replace /> },
  //         { path: "overview", element: <ClassManagement /> },
  //         { path: "attendance", element: <ClassManagement /> },
  //         { path: "materials", element: <TeacherDocuments /> },
  //         { path: "assignments", element: <TeacherAssignments /> },
  //         { path: "exams", element: <TeacherAssignments /> },
  //         { path: "grading", element: <Grading /> },
  //         { path: "qa", element: <TeacherQA /> },
  //         { path: "announcements", element: <TeacherAnnouncements /> },
  //         { path: "analytics", element: <TeacherAnalytics /> },
  //       ],
  //     },

  //     // Trung tâm tác vụ GV
  //     { path: "assignments", element: <TeacherAssignments /> },
  //     { path: "assignments/:assignmentId", element: <TeacherAssignments /> },
  //     { path: "grading", element: <Grading /> },
  //     { path: "documents", element: <TeacherDocuments /> },
  //     { path: "student-progress", element: <StudentProgress /> },
  //     { path: "student-progress/:studentId", element: <StudentProgress /> },
  //     { path: "reports", element: <TeacherReports /> },
  //     { path: "qa", element: <TeacherQA /> },
  //     { path: "announcements", element: <TeacherAnnouncements /> },
  //     { path: "analytics", element: <TeacherAnalytics /> },
  //     { path: "calendar", element: <TeacherCalendar /> },
  //     { path: "profile", element: <TeacherProfile /> },
  //   ],
  // },

  // // =======================
  // // Admin routes
  // // =======================
  // {
  //   path: "/admin",
  //   element: (
  //     <AdminRoute>
  //       <LayoutAdmin />
  //     </AdminRoute>
  //   ),
  //   errorElement: <Error />,
  //   children: [
  //     { index: true, element: <AdminDashboard /> },
  //     { path: "users", element: <UserManagement /> },
  //     { path: "users/:userId", element: <UserManagement /> },
  //     { path: "courses", element: <CourseManagement /> },
  //     { path: "courses/:courseId", element: <CourseManagement /> },
  //     { path: "roles", element: <RoleManagement /> },
  //     { path: "settings", element: <SystemSettings /> },
  //     { path: "reports", element: <AdminReports /> },
  //     { path: "profile", element: <AdminProfile /> },
  //   ],
  // },

  // Fallback 404
  { path: "*", element: <Error /> },
]);
