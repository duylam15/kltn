import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
  FolderOpen
} from "lucide-react";
import { useState } from "react";

export default function LayoutDefault() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Menu cho thanh navigation dọc (sidebar) - giống Google Classroom
  const sidebarMenu = [
    { to: "/student", label: "Màn hình chính", icon: Home, end: true },
    { to: "/student/calendar", label: "Lịch", icon: Calendar },
    { to: "/student/archived", label: "Đã đăng ký", icon: Archive, chevron: true },
    { to: "/student/todo", label: "Việc cần làm", icon: ClipboardList },
    { to: "/student/settings", label: "Cài đặt", icon: Settings },
  ];

  // Enrolled classes - giống sidebar Google Classroom
  const enrolledClasses = [
    {
      id: "sgu25",
      label: "[SGU25] PPNCK trong CNTT - N02",
      code: "SGU25_01 - Học kỳ 2",
      initial: "S"
    },
    {
      id: "java",
      label: "Java 4 kì 2 2023 - 2024",
      code: "JAVA_2023",
      initial: "J"
    },
    {
      id: "ai",
      label: "Cơ sở trí tuệ nhân tạo sáng t4",
      code: "AI_T4",
      initial: "C"
    },
  ];

  return (
    <div className="h-screen  flex flex-col">
      {/* Header - Exact Google Classroom Style */}
      <header className="h-16 bg-[#f8fafd] flex-shrink-0 z-40">
        <div className="h-full flex items-center px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
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
          </div>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-1">
            {/* Google Apps */}
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <div className="grid grid-cols-3 gap-0.5 w-6 h-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-600 rounded-sm" />
                ))}
              </div>
            </button>

            {/* User Profile */}
            <button className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 text-white text-sm font-medium flex items-center justify-center">
                U
              </div>
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
          ${sidebarCollapsed ? 'w-20 lg:w-20' : 'w-72 lg:w-72'}
          bg-[#f8fafd] flex-shrink-0
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
                className={({ isActive }) =>
                  `flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-lg text-sm font-medium transition-all duration-300 group overflow-x-hidden ${isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                  }`
                }
                title={sidebarCollapsed ? item.label : ''}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-6'} ${sidebarCollapsed ? 'w-full' : ''}`}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                </div>
                {item.chevron && !sidebarCollapsed && (
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
          {/* Sub Navigation Tabs */}
          <div className="flex-1 overflow-y-auto p-6 bg-white rounded-tl-3xl ">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}