import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, ClipboardList, FileText, BarChart3, Calendar, MessageSquare, Megaphone } from "lucide-react";


export default function LayoutTeacher() {
  const menu = [
    { to: "/teacher", label: "Tổng quan", icon: LayoutDashboard, end: true },
    { to: "/teacher/classes", label: "Lớp học", icon: Users },
    { to: "/teacher/assignments", label: "Bài tập", icon: ClipboardList },
    { to: "/teacher/grading", label: "Chấm điểm", icon: FileText },
    { to: "/teacher/documents", label: "Tài liệu", icon: BookOpen },
    { to: "/teacher/qa", label: "Q&A", icon: MessageSquare },
    { to: "/teacher/announcements", label: "Thông báo", icon: Megaphone },
    { to: "/teacher/analytics", label: "Thống kê", icon: BarChart3 },
    { to: "/teacher/calendar", label: "Lịch dạy", icon: Calendar },
  ];


  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r bg-white p-3 space-y-1">
        <div className="px-2 py-3 text-base font-semibold">CTIT Learn • GV</div>
        {menu.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${isActive ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            <m.icon className="h-4 w-4" />
            {m.label}
          </NavLink>
        ))}
      </aside>
      <main className="bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}