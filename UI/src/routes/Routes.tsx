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
import StudentDashboard from "../pages/Student/StudentDashboard";
import Courses from "../pages/Student/Courses";
import ClassList from "../pages/Student/ClassList";
import MaterialsStudent from "../pages/Student/MaterialsStudent";
import AttendanceStudent from "../pages/Student/AttendanceStudent";
import CourseDetail from "../pages/Student/CourseDetail";

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

// Route guards
import PublicRoute from "./PublicRoute";
import StudentRoute from "./StudentRoute";
import TeacherRoute from "./TeacherRoute";
import AdminRoute from "./AdminRoute";
import Error from "./Error";
import RequirePermission from "./RequirePermission";
import Students from "../pages/Admin/Students";
import Teachers from "../pages/Admin/Teachers";
import DashboardStudent from "../pages/Student/DashboardStudent";
import CourseLayoutStudent from "../layouts/CourseLayoutStudent";
import OverviewAdmin from "../pages/Admin/OverviewAdmin";
import Instructors from "../pages/Admin/Instructors";
import Assignments from "../pages/Admin/Assignments";
import Questions from "../pages/Admin/Questions";
import Subjects from "../pages/Admin/Subjects";
import Chat from "../pages/Teacher/Chat";
import GradesTeacher from "../pages/Teacher/GradesTeacher";
import GroupList from "../pages/Teacher/GroupList";
import CoursesAdmin from "../pages/Admin/CoursesAdmin";

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
      { index: true, element: <StudentDashboard /> },
      { path: "courses", element: <Courses /> },
      {
        path: "courses/:courseId",
        element: <CourseLayoutStudent />,
        children: [
          { index: true, loader: () => redirect("overview") },
          { path: "overview", element: <Overview /> },
          { path: "friend", element: <ClassList /> },
          { path: "materials", element: <MaterialsStudent /> },
          { path: "roll-call", element: < AttendanceStudent />},
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
      { index: true, element: <Dashboard /> },
      { path: "courses", element: <Courses /> },
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
      { index: true, element: <Reports /> },
      { path: "notifications", element: <Notifications /> },
      { path: "reports", element: <Reports /> },
      { path: "roles", element: <Roles /> },
      { path: "instructors", element: <Instructors /> },
      { path: "assignments", element: <Assignments /> },
      { path: "questions", element: <Questions /> },
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
          { path: "overview", element: <OverviewAdmin /> },
          { path: "friend", element: <StudentList /> },
          { path: "materials", element: <Materials /> },
          { path: "roll-call", element: <RollCall /> },
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
      },



      { path: "teachers", element: <Teachers /> },
    ],
  },

  // Fallback
  { path: "*", element: <Error /> },
]);
