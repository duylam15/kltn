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
import { Card, Skeleton } from "antd";
import { useAuth } from "../context/authContext";
import instance from "../utils/axiosInstance";

export default function LayoutTeacher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Menu cho thanh navigation dọc (sidebar) - giống Google Classroom
  const sidebarMenu = [
    { to: "/teacher", label: "Màn hình chính", icon: Home, end: true },
    { to: "/teacher/materials", label: "Tài liệu", icon: FolderOpen },
    { to: "/teacher/assignments", label: "Bài tập", icon: ClipboardList },
    { to: "/teacher/questions", label: "Câu hỏi", icon: Tag },
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
        const res = await instance.get(
          `/course-sections/${courseId}`
        );
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

  // Đóng sidebar khi resize về desktop
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
      <style>
        {`
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }

          /* Mobile optimizations */
          @media (max-width: 768px) {
            . course-info-text {
              font-size: 12px ! important;
              max-width: 200px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          @media (max-width: 480px) {
            .course-info-text {
              max-width: 150px;
            }
          }
        `}
      </style>

      {/* Header - Responsive */}
      <header className="h-14 md:h-16 bg-[#e7effc] flex-shrink-0 z-40 border-b border-gray-200">
        <div className="h-full flex items-center px-3 md:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Mobile Menu Button */}
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

            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded flex items-center justify-center overflow-hidden">
                <img src="/logosgu.png" alt="SGU Logo" className="h-full w-full object-contain" />
              </div>
            </div>

            {/* Thông tin lớp học */}
            <div className="flex-1 min-w-0 flex justify-center md:justify-start md:ml-4 lg:ml-[120px]">
              {loading && courseId ? (
                <Skeleton.Input active size="small" className="w-32 md:w-64 lg:w-80" />
              ) : section ? (
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="font-semibold md:font-bold text-xs md:text-sm text-gray-800 course-info-text">
                    {section.subject.subjectName} - {section.sectionName} - {section.term?.name}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Section */}
          <div className="ml-2 md:ml-auto flex items-center gap-0.5 md:gap-1 flex-shrink-0">
            {/* Google Apps - Hidden on small mobile */}
            <button className="hidden sm:block p-1.5 md:p-2 rounded-full hover:bg-gray-100 transition-colors">
              <div className="grid grid-cols-3 gap-0.5 w-5 h-5 md:w-6 md:h-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gray-600 rounded-sm"
                  />
                ))}
              </div>
            </button>

            {/* User Profile */}
            <button
              className="ml-1 md:ml-2 p-0.5 md:p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => navigate("/teacher/profile")}
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

            {/* Logout Button */}
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
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Responsive */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-50 
          ${sidebarCollapsed ? 'w-16 lg:w-20' : 'w-64 md:w-60'}
          bg-[#e7effc] flex-shrink-0
          transform transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          top-14 md:top-16
          border-r border-gray-200
        `}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-3 md:p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded bg-green-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <span className="font-medium text-sm md:text-base text-gray-900">Lớp học</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1. 5 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-2 md:px-3 py-3 md:py-4 overflow-y-auto flex-1">
            {sidebarMenu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => {
                  // Tab Màn hình chính: chỉ sáng khi URL chính xác "/teacher"
                  if (item.to === "/teacher") {
                    const active = location.pathname === "/teacher";
                    return `
                      flex items-center ${sidebarCollapsed ? "justify-center px-1 md:px-2" : "justify-start gap-3 md:gap-4 px-3 md:px-4"} 
                      py-2. 5 md:py-3 mb-1 md:mb-2 rounded-lg text-xs md:text-sm font-medium 
                      transition-all duration-300 group overflow-hidden
                      ${active ? "bg-blue-200 text-blue-700" : "text-gray-700 hover:bg-blue-100"}
                    `;
                  }

                  // Các tab khác dùng isActive tiêu chuẩn
                  return `
                    flex items-center ${sidebarCollapsed ? "justify-center px-1 md:px-2" : "justify-start gap-3 md:gap-4 px-3 md:px-4"} 
                    py-2.5 md:py-3 mb-1 md:mb-2 rounded-lg text-xs md:text-sm font-medium 
                    transition-all duration-300 group overflow-hidden
                    ${isActive ? "bg-blue-200 text-blue-700" : "text-gray-700 hover:bg-blue-100"}
                  `;
                }}
                title={sidebarCollapsed ? item.label : ''}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full' : 'gap-3 md:gap-4'}`}>
                  <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  )}
                </div>
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