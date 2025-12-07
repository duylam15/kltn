import { Outlet, NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  LogOut,
  Home,
  Settings,
  ChevronDown,
  Menu,
  X,
  Archive,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "antd";
import { useAuth } from "../context/authContext";
import instance from "../utils/axiosInstance";
import NotificationBell from "../components/NotificationBell"; // 🔔 THÊM IMPORT

export default function LayoutDefault() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarMenu = [
    { to: "/student", label: "Màn hình chính", icon: Home, end: true },
    { to: "/student/calendar", label: "Lịch", icon: Calendar },
    { to: "/student/archived", label: "Đã đăng ký", icon: Archive, chevron: true },
    { to: "/student/todo", label: "Việc cần làm", icon: ClipboardList },
    { to: "/student/settings", label: "Cài đặt", icon: Settings },
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
      setSection(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const res = await instance.get(`/course-sections/${courseId}`);
        const json = await res.data;
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 md:h-16 bg-[#e7effc] flex-shrink-0 z-40">
        <div className="h-full flex items-center px-3 md:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <button
              className="p-1. 5 md:p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setSidebarCollapsed(!sidebarCollapsed);
                } else {
                  setSidebarOpen(true);
                }
              }}
            >
              <Menu className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
            </button>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded flex items-center justify-center overflow-hidden">
                <img src="/logosgu.png" alt="SGU Logo" className="h-full w-full object-contain" />
              </div>
            </div>

            <div className="flex-1 min-w-0 flex justify-center md:justify-start md:ml-4 lg:ml-[120px]">
              {loading && courseId ? (
                <Skeleton.Input active size="small" className="w-32 md:w-64 lg:w-80" />
              ) : section ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="font-semibold md:font-bold text-xs md:text-sm text-gray-800 course-info-text">
                      {section.subject.subjectName} - {section.sectionName}
                      <span className="hidden sm:inline"> - {section.term?.name}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Section */}
          <div className="ml-2 md:ml-auto flex items-center justify-center gap-1 md:gap-2 h-full">
            {/* 🔔 Notification Bell - THÊM Ở ĐÂY */}
            <div className="flex items-center justify-center h-full text-center mt-2">
              <NotificationBell />
            </div>

            {/* User Profile */}
            <button
              className="ml-1 md:ml-2 p-0.5 md:p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => navigate("/student/profile")}
              title="Hồ sơ cá nhân"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="h-7 w-7 md:h-8 md:w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs md:text-sm font-medium flex items-center justify-center">
                  {getInitial()}
                </div>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="ml-1 md:ml-2 p-1. 5 md:p-2 rounded-full hover:bg-red-100 transition-colors text-red-600"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - giữ nguyên code cũ của bạn */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 
          ${sidebarCollapsed ? 'w-16 lg:w-20' : 'w-64 md:w-60'}
          bg-[#e7effc] flex-shrink-0
          transform transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          md:top-16
        `}>
          <div className="lg:hidden flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded bg-green-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <span className="font-medium text-sm md:text-base text-gray-900">Lớp học</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <nav className="px-2 md:px-3 py-3 md:py-4 overflow-y-auto flex-1 space-y-1">
            {sidebarMenu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
        flex items-center
        ${sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3 px-3"}
        py-3
        rounded-lg text-xs md:text-sm font-medium
        transition-all duration-200
        ${isActive ? "bg-blue-200 text-blue-700" : "text-gray-700 hover:bg-blue-100"}
      `}
                title={sidebarCollapsed ? item.label : ""}
              >
                <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />

                {!sidebarCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                    {item.label}
                  </span>
                )}

                {item.chevron && !sidebarCollapsed && (
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                )}
              </NavLink>
            ))}
          </nav>


        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-[#e7effc] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-2 md:p-3 bg-[#fff] rounded-tl-2xl md:rounded-tl-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}