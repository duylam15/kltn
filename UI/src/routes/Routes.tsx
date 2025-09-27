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
import Dashboard from "../pages/Student/Dashboard";
import Courses from "../pages/Student/Courses";
import CourseDetail from "../pages/Student/CourseDetail";

// Teacher pages
import Overview from "../pages/Teacher/Overview";
import Materials from "../pages/Teacher/Materials";
import RollCall from "../pages/Teacher/RollCall";
import RollCallCheckIn from "../pages/Teacher/RollCallCheckIn";
import StudentList from "../pages/Teacher/StudentList";
import TeacherDashboard from "../pages/Teacher/Dashboard";

// Admin pages
import AdminQuestions from "../pages/Admin/AdminQuestions";
import Notifications from "../pages/Admin/Notifications";
import Reports from "../pages/Admin/Reports";
import Roles from "../pages/Admin/Roles";
import Users from "../pages/Admin/Users";

// Route guards
import PublicRoute from "./PublicRoute";
import StudentRoute from "./StudentRoute";
import TeacherRoute from "./TeacherRoute";
import AdminRoute from "./AdminRoute";
import Error from "./Error";

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
      { index: true, element: <Dashboard /> },
      { path: "courses", element: <Courses /> },
      {
        path: "courses/:courseId",
        element: <CourseLayout />,
        children: [
          { index: true, loader: () => redirect("overview") },
          { path: "overview", element: <Overview /> },
          { path: "friend", element: <StudentList /> },
          { path: "materials", element: <Materials /> },
          { path: "roll-call", element: <RollCall /> },
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
      { index: true, element: <TeacherDashboard /> },
      { path: "overview", element: <Overview /> },
      { path: "materials", element: <Materials /> },
      { path: "roll-call", element: <RollCall /> },
      { path: "students", element: <StudentList /> },
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
      { path: "questions", element: <AdminQuestions /> },
      { path: "notifications", element: <Notifications /> },
      { path: "reports", element: <Reports /> },
      { path: "roles", element: <Roles /> },
      { path: "users", element: <Users /> },
    ],
  },

  // Fallback
  { path: "*", element: <Error /> },
]);
