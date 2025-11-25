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
import CoursesAdmin from "../pages/Admin/CoursesAdmin";
import AdminStats from "../pages/Admin/AdminStats";



// Route guards
import Students from "../pages/Admin/Students";
import Teachers from "../pages/Admin/Teachers";
import MaterialsTeacher from "../pages/Teacher/MaterialsTeacher";
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

import { getRoleRoute, ROLE_ROUTES } from "../constants/roles";


// Import các components khác...
import PublicRoute from "./PublicRoute";
import { StudentRoute, TeacherRoute, AdminRoute } from "./RoleRoutes";
import Error from "./Error";
import RequirePermission from "./RequirePermission";
import CourseLayoutStudent from "../layouts/CourseLayoutStudent";
import TestRefreshToken from "../pages/Admin/TestRefreshToken";
import QuestionsTeacher from "../pages/Teacher/QuestionsTeacher";
import JoinClassByInvite from "../pages/Teacher/JoinClassByInvite";
import MaterialsStudent from "../pages/Student/MaterialsStudent";

// Helper function để check auth và redirect
const checkAuthAndRedirect = async () => {
  try {
    const res = await axios.get("http://localhost:4000/api/v1/auths/me", {
      withCredentials: true,
    });

    const roleName = res.data.user?.role?.name;
    const redirectPath = getRoleRoute(roleName);

    return redirect(redirectPath);
  } catch {
    return redirect("/login");
  }
};


export const router = createBrowserRouter([
  // ========== Root check auth ==========
  {
    path: "/",
    loader: checkAuthAndRedirect,
  },

  // ========== Public Routes ==========
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
    path: "/qr",
    element: <VRPage />,
  },
  {
    path: "/diemdanh",
    element: <RollCallCheckIn />,
  },

  {
    path: "/join",
    element: <JoinClassByInvite />
  },


  // ========== Student Routes ==========
  {
    path: "/student",
    element: (
      <StudentRoute>
        <LayoutDefault />
      </StudentRoute>
    ),
    errorElement: <Error />,
    children: [
      { index: true, element: <DashboardStudent /> },
      {
        path: "courses/:courseId",
        element: <CourseLayoutStudent />,
        children: [
          { index: true, loader: () => redirect("overview") },
          { path: "overview", element: <OverviewStudent /> },
          { path: "groups", element: <Group /> },
          { path: "materials", element: <MaterialsStudent /> },
          { path: "roll-call", element: <RollCallStudent /> },
          { path: "assignments", element: <AssignmentsStudent /> },
          { path: "assignments/:assignmentId", element: <AssignmentsDetailsStudent /> },
          { path: "assignments/:assignmentId/history", element: <AssignmentSubmissionHistory /> },
          { path: "assignments/:assignmentId/score", element: <AssignmentsScore /> },
          { path: "chat", element: <Chat /> },
          { path: "grades", element: <GradesStudent /> },
        ],
      },
    ],
  },

  // ========== Teacher Routes ==========
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
      { path: "materials", element: <MaterialsTeacher /> },
      { path: "assignments", element: <AssignmentsTeacherOut /> },
      { path: "questions", element: <QuestionsTeacher /> },

    ],
  },


  // ========== Admin Routes ==========
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
      { path: "instructors", element: <Instructors /> },
      { path: "assignments", element: <Assignments /> },
      { path: "questions", element: <Questions /> },
      { path: "materials", element: <MaterialsAdmin /> },
      { path: "subjects", element: <Subjects /> },
      { path: "courses", element: <CoursesAdmin /> },
      { path: "TestRefreshToken", element: <TestRefreshToken /> },
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
        path: "students",
        lazy: async () => {
          const { default: Students } = await import("../pages/Admin/Students");
          const { default: RequirePermission } = await import("./RequirePermission");
          return {
            element: (
              <RequirePermission permission="user.read">
                <Students />
              </RequirePermission>
            ),
          };
        },
      },
      { path: "teachers", element: <Teachers /> },
    ],
  },

  // ========== Fallback ==========
  { path: "*", element: <Error /> },
]);;