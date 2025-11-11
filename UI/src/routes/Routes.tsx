import { createBrowserRouter, redirect } from "react-router-dom";
import axios from "axios";

// Layouts
import LayoutDefault from "../layouts/LayoutDefault";
import LayoutTeacher from "../layouts/LayoutTeacher";
import LayoutAdmin from "../layouts/LayoutAdmin";
import CourseLayout from "../layouts/CourseLayout";

// Auth
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";

// Student pages
import Dashboard from "../pages/Teacher/Dashboard";
<<<<<<< HEAD
=======
import StudentDashboard from "../pages/Student/StudentDashboard";
import Courses from "../pages/Student/Courses";
import ClassList from "../pages/Student/ClassList";
import MaterialsStudent from "../pages/Student/MaterialsStudent";
import AttendanceStudent from "../pages/Student/AttendanceStudent";
import CourseDetail from "../pages/Student/CourseDetail";
>>>>>>> locdev

// Teacher pages
import Overview from "../pages/Teacher/Overview";
import Materials from "../pages/Teacher/Materials";
import RollCall from "../pages/Teacher/RollCall";
import RollCallCheckIn from "../pages/Teacher/RollCallCheckIn";
import StudentList from "../pages/Teacher/StudentList";
import TeacherDashboard from "../pages/Teacher/Dashboard";
import AssignmentsTeacher from "../pages/Teacher/AssignmentsTeacher";

// Admin pages
import Notifications from "../pages/Admin/Notifications";
import Reports from "../pages/Admin/Reports";
import Roles from "../pages/Admin/Roles";
<<<<<<< HEAD
import CoursesAdmin from "../pages/Admin/CoursesAdmin";
import AdminStats from "../pages/Admin/AdminStats";


=======
>>>>>>> locdev

// Route guards
import PublicRoute from "./PublicRoute";
import StudentRoute from "./StudentRoute";
import TeacherRoute from "./TeacherRoute";
import AdminRoute from "./AdminRoute";
import Error from "./Error";
import RequirePermission from "./RequirePermission";
import Students from "../pages/Admin/Students";
import Teachers from "../pages/Admin/Teachers";
import MaterialsTeacher from "../pages/Teacher/MaterialsTeacher";
import CourseLayoutStudent from "../layouts/CourseLayoutStudent";
<<<<<<< HEAD
import OverviewAdmin from "../pages/Admin/OverviewAdmin";
import Instructors from "../pages/Admin/Instructors";
import Assignments from "../pages/Admin/Assignments";
import Questions from "../pages/Admin/Questions";
import Subjects from "../pages/Admin/Subjects";
import Chat from "../pages/Teacher/Chat";
import GradesTeacher from "../pages/Teacher/GradesTeacher";
import GroupList from "../pages/Teacher/GroupList";
import MaterialsAdmin from "../pages/Admin/MaterialsAdmin";
import Group from "../pages/Student/Group";
import MaterialStudent from "../pages/Student/MaterialStudent";
import RollCallStudent from "../pages/Student/RollCallStudent";
import AssignmentsStudent from "../pages/Student/AssignmentsStudent";
import GradesStudent from "../pages/Student/GradesStudent";
import OverviewStudent from "../pages/Student/OverviewStudent";
import DashboardStudent from "../pages/Student/DashboardStudent";
import AssignmentsDetailsStudent from "../pages/Student/AssignmentsDetailsStudent";
import AssignmentsTeacherOut from "../pages/Teacher/AssignmentsTeacherOut";
import VRPage from "../pages/VRPage";
import AssignmentSubmissionHistory from "../pages/Student/AssignmentSubmissionHistory";
import AssignmentsScore from "../pages/Student/AssignmentsScore";
=======
>>>>>>> locdev

export const router = createBrowserRouter([
  // ========== Root check auth ==========
  {
    path: "/",
    loader: async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/auths/me", {
          withCredentials: true,
        });

        const roleId: number = res.data.user?.roleId;

        if (roleId === 100) return redirect("/student");
        if (roleId === 101) return redirect("/teacher");
        if (roleId === 102) return redirect("/admin");

        return redirect("/login");
      } catch {
        return redirect("/login");
      }
    },
  },

  // ========== Public ==========
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
   {
    path: "/qr",
    element: (
      <VRPage />
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
  {
    path: "/diemdanh",
    element: <RollCallCheckIn />,
  },

  // ========== Student ==========
  {
    path: "/student",
    element: (
      <StudentRoute>
        <LayoutDefault />
      </StudentRoute>
    ),
    errorElement: <Error />,
    children: [
<<<<<<< HEAD
      { index: true, element: <DashboardStudent /> },
=======
      { index: true, element: <StudentDashboard /> },
      { path: "courses", element: <Courses /> },
>>>>>>> locdev
      {
        path: "courses/:courseId",
        element: <CourseLayoutStudent />,
        children: [
          { index: true, loader: () => redirect("overview") },
<<<<<<< HEAD
          { path: "overview", element: <OverviewStudent /> },
          { path: "groups", element: <Group /> },
          { path: "materials", element: <MaterialStudent /> },
          { path: "roll-call", element: <RollCallStudent /> },
          { path: "assignments", element: <AssignmentsStudent /> },
          { path: "assignments/:assignmentId", element: <AssignmentsDetailsStudent /> },
          { path: "assignments/:assignmentId/history", element: <AssignmentSubmissionHistory /> },
          { path: "assignments/:assignmentId/score", element: <AssignmentsScore /> },
          { path: "chat", element: <Chat /> },
          { path: "grades", element: <GradesStudent /> },
=======
          { path: "overview", element: <Overview /> },
          { path: "friend", element: <ClassList /> },
          { path: "materials", element: <MaterialsStudent /> },
          { path: "roll-call", element: < AttendanceStudent />},
>>>>>>> locdev
        ],
      },
    ],
  },

  // ========== Teacher ==========
  {
    path: "/teacher",
    element: (
      <TeacherRoute>
        <LayoutTeacher />
      </TeacherRoute>
    ),
    errorElement: <Error />,
    children: [
<<<<<<< HEAD
      { index: true, element: <Dashboard /> },
=======
      { index: true, element: <DashboardStudent /> },
      { path: "courses", element: <Courses /> },
>>>>>>> locdev
      {
        path: "courses/:courseId",
        element: <CourseLayout />,
        children: [
          { index: true, loader: () => redirect("overview") },
          { path: "overview", element: <Overview /> },
          { path: "groups", element: <GroupList /> },
          { path: "students", element: <StudentList /> },
          { path: "materials", element: <Materials /> },
          { path: "roll-call", element: <RollCall /> },
          { path: "chat", element: <Chat /> },
          { path: "assignments", element: <AssignmentsTeacher /> },
          { path: "grades", element: <GradesTeacher /> },
        ],
      },
      {
        path: "materials",
        element: <MaterialsTeacher />,
      },
      {
        path: "assignments",
        element: <AssignmentsTeacherOut />,
      },
    ],
  },

  // ========== Admin ==========
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <LayoutAdmin />
      </AdminRoute>
    ),
    errorElement: <Error />,
    children: [
      { index: true, element: <AdminStats /> },
      { path: "notifications", element: <Notifications /> },
      { path: "reports", element: <Reports /> },
      { path: "roles", element: <Roles /> },
<<<<<<< HEAD
      { path: "instructors", element: <Instructors /> },
      { path: "assignments", element: <Assignments /> },
      { path: "questions", element: <Questions /> },
      { path: "materials", element: <MaterialsAdmin /> },
      { path: "subjects", element: <Subjects /> },
      // Admin courses
      {
        path: "courses",
        element: <CoursesAdmin />, // Trang danh sách courses
      },
      {
        path: "courses/:courseId",
        element: <CourseLayout />, // Layout chi tiết 1 course
        children: [
          { index: true, loader: () => redirect("overview") },
          { path: "overview", element: <Overview /> },
          { path: "groups", element: <GroupList /> },
          { path: "students", element: <StudentList /> },
          { path: "materials", element: <Materials /> },
          { path: "roll-call", element: <RollCall /> },
          { path: "chat", element: <Chat /> },
          { path: "assignments", element: <AssignmentsTeacher /> },
          { path: "grades", element: <GradesTeacher /> },
        ],
      },
      {
        path: "students",
        lazy: async () => {
          const { default: Students } = await import("../pages/Admin/Students");
          const { default: RequirePermission } = await import("./RequirePermission");
          return {
            element: (
              <RequirePermission permission="*">
                <Students />
              </RequirePermission>
            ),
          };
        },
=======
      {
        path: "students",
        element: (
          <RequirePermission permission="user:view">
            <Students />
          </RequirePermission>
        )
>>>>>>> locdev
      },



      { path: "teachers", element: <Teachers /> },
    ],
  },

  // Fallback
  { path: "*", element: <Error /> },
]);
