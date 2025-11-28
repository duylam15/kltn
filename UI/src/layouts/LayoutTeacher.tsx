import { Outlet, NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Bell,
  ClipboardList,
  LineChart,
  LogOut,
  Search,
  Home,
  User,
  Settings,
  ChevronDown,
  Menu,
  X,
  Plus,
  Archive,
  FolderOpen,
  Tag
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import { Card, Skeleton } from "antd";
import { useAuth } from "../context/authContext";
import { API_URL } from "../utils/api";

export default function LayoutTeacher() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Menu cho thanh navigation dọc (sidebar) - giống Google Classroom
  const sidebarMenu = [
    { to: "/teacher", label: "Màn hình chính", icon: Home, end: true },
    { to: "/teacher/materials", label: "Tài liệu", icon: BookOpen },
    { to: "/teacher/assignments", label: "Bài tập", icon: BookOpen },
    { to: "/teacher/questions", label: "Câu hỏi", icon: BookOpen },
  ];

  const { user, logout } = useAuth();


  const getInitial = () =>
  user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const { courseId } = useParams();
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!courseId) {
      // Không có courseId => reset state
      setSection(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/course-sections/${courseId}`
        );
        const json = await res.json();
        if (mounted) {
          setSection(json?.data ?? null);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [courseId]);




  return (
    <div className="h-screen  flex flex-col">
      {/* Header - Exact Google Classroom Style */}
      <header className="h-16 bg-[#edf3fc] flex-shrink-0 z-40">
        <div className="h-full flex items-center px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setSidebarCollapsed(!sidebarCollapsed);
                } else {
                  setSidebarOpen(true);
                }
              }}
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-green-600 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-normal text-gray-700">Lớp học</span>
            </div>

            {/* Thông tin lớp học – căn giữa */}
            <div className="flex-1 flex ml-20">
              {loading && courseId ? (
                <Skeleton.Input active size="small" style={{ width: 320 }} />
              ) : section ? (
                <div className="flex items-center gap-3 text-center">
                  <span className="font-bold text-sm text-gray-800">
                    {section.subject.subjectCode} - {section.subject.subjectName} •{" "}
                    {section.sectionCode} - {section.sectionName} ({section.term?.name})
                  </span>
                </div>
              ) : null}
            </div>

          </div>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-1">
            {/* Google Apps */}
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <div className="grid grid-cols-3 gap-0.5 w-6 h-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-600 rounded-sm"
                  />
                ))}
              </div>
            </button>

            {/* User Profile */}
            <button
  className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
  onClick={() => navigate("/teacher/profile")}
  title="Hồ sơ cá nhân"
>
  {user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt="avatar"
      className="h-8 w-8 rounded-full object-cover"
    />
  ) : (
    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm font-medium flex items-center justify-center">
      {getInitial()}
    </div>
  )}
</button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-full hover:bg-red-100 transition-colors text-red-600"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar - Exact Google Classroom Style */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 
          ${sidebarCollapsed ? 'w-20 lg:w-20' : 'w-60 lg:w-60'}
          bg-[#e7effc] flex-shrink-0
          transform transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-green-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium text-gray-900">Lớp học</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 overflow-y-auto flex-1">
            {sidebarMenu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => {
                  // luôn sáng khi URL bắt đầu bằng /teacher
                  const active =
                    location.pathname.startsWith("/teacher") && item.to === "/teacher"
                      ? true
                      : isActive;

                  return `
      flex items-center ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"} 
      py-3 rounded-lg text-sm font-medium transition-all duration-300 group overflow-x-hidden
      ${active ? "bg-blue-200 text-blue-700" : "text-gray-700 hover:bg-blue-200"}
    `;
                }}
                title={sidebarCollapsed ? item.label : ''}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-6'} ${sidebarCollapsed ? 'w-full' : ''}`}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                </div>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#e7effc] flex flex-col overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex-1 overflow-y-auto p-3 bg-[#fff] rounded-tl-3xl ">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}