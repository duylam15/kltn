import { createBrowserRouter, redirect } from "react-router-dom";

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
import AssignmentsTeacher from "../pages/Teacher/Assigment/AssignmentsTeacher";

// Admin pages
import Notifications from "../pages/Admin/NotificationsAdmin";
import Reports from "../pages/Admin/ReportsAdmin";
import Roles from "../pages/Admin/RolesAdmin";
import CoursesAdmin from "../pages/Admin/CoursesAdmin";
import AdminStats from "../pages/Admin/AdminStats";



// Route guards
import Students from "../pages/Admin/StudentsAdmin";
import Teachers from "../pages/Admin/TeachersAdmin";
import MaterialsTeacher from "../pages/Teacher/MaterialsTeacher";
import OverviewAdmin from "../pages/Admin/OverviewAdmin";
import Instructors from "../pages/Admin/InstructorsAdmin";
import Assignments from "../pages/Admin/AssignmentsAdmin";
import Questions from "../pages/Admin/QuestionsAdmin";
import Subjects from "../pages/Admin/SubjectsAdmin";
import Chat from "../pages/Teacher/Chat";
import GradesTeacher from "../pages/Teacher/GradesTeacher";
import GroupList from "../pages/Teacher/GroupList";
import MaterialsAdmin from "../pages/Admin/MaterialsAdmin";
import Group from "../pages/Student/Group";
import RollCallStudent from "../pages/Student/RollCallStudent";
import AssignmentsStudent from "../pages/Student/AssignmentsStudent";
import DashboardStudent from "../pages/Student/DashboardStudent";
import AssignmentsDetailsStudent from "../pages/Student/AssignmentsDetailsStudent";
import AssignmentsTeacherOut from "../pages/Teacher/AssignmentsTeacherOut";
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
import instance from "../utils/axiosInstance";
import ProfilePage from "../pages/Profile/ProfilePage";
import AssignmentManagement from "../pages/Teacher/Assigment/AssignmentManagement";
import AssignmentGrading from "../pages/Teacher/Assigment/AssignmentGrading";
import AlwaysPublicRoute from "./AlwaysPublicRoute";
// Helper function để check auth và redirect
const checkAuthAndRedirect = async () => {
  try {
    const res = await instance.get("/auths/me", {
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
    path: "/diemdanh",
    element: (
        <RollCallCheckIn />
    ),
  },
  {
    path: "/join",
    element: (
        <JoinClassByInvite />
    ),
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
          { index: true, loader: () => redirect("groups") },
          { path: "groups", element: <Group /> },
          { path: "materials", element: <MaterialsStudent /> },
          { path: "roll-call", element: <RollCallStudent /> },
          { path: "assignments", element: <AssignmentsStudent /> },
          { path: "assignments/:assignmentId", element: <AssignmentsDetailsStudent /> },
          { path: "assignments/:assignmentId/history", element: <AssignmentSubmissionHistory /> },
          { path: "assignments/:assignmentId/score", element: <AssignmentsScore /> },
          { path: "chat", element: <Chat /> },
        ],
      },
      { path: "profile", element: <ProfilePage /> },
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
          // Route cho teacher assignments
          {
            path: "assignments",
            children: [
              {
                index: true,
                element: <AssignmentManagement />, // File 1: Danh sách và CRUD
              },
              {
                path: ":assignmentId/grading",
                element: <AssignmentGrading />, // File 2: Bảng điểm và lịch sử nộp bài
              },
            ],
          }, { path: "grades", element: <GradesTeacher /> },
        ],
      },
      { path: "materials", element: <MaterialsTeacher /> },
      { path: "assignments", element: <AssignmentsTeacherOut /> },
      { path: "questions", element: <QuestionsTeacher /> },
      { path: "profile", element: <ProfilePage /> },

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
          const { default: Students } = await import("../pages/Admin/StudentsAdmin");
          const { default: RequirePermission } = await import("./RequirePermission");
          return {
            element: (
              <Students />
            ),
          };
        },
      },
      { path: "teachers", element: <Teachers /> },
      { path: "profile", element: <ProfilePage /> },

    ],
  },

  // ========== Fallback ==========
  { path: "*", element: <Error /> },
]);;