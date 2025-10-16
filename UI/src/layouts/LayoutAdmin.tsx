import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
	BookOpen,
	Bell,
	ClipboardList,
	LineChart,
	LogOut,
	User,
	Settings,
	Menu,
	X,
	GraduationCap,
	Users,
	Book,
	FileQuestion,
	UserCog,
	Layers,
	FileText,
} from "lucide-react";
import { useState } from "react";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/authContext";

export default function LayoutAdmin() {
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const { user,  logout } = useAuth();

	// Hàm check quyền
	const hasPermission = (perm: string) =>
		user?.role?.permissions?.some((p) => p.name === perm) ?? false;

	const sidebarMenu = [
		// Tổng quan
		{ to: "/admin", label: "Thống kê", icon: LineChart, end: true },
		{ to: "/admin/reports", label: "Báo cáo", icon: ClipboardList },

		// Quản lý học tập
		{ to: "/admin/subjects", label: "Môn học", icon: Book },
		{ to: "/admin/courses", label: "Học phần", icon: Layers },
		{ to: "/admin/assignments", label: "Bài tập", icon: FileQuestion },
		{ to: "/admin/questions", label: "Câu hỏi", icon: BookOpen },
		{ to: "/admin/materials", label: "Tài liệu", icon: FileText },

		// Quản lý con người
		{ to: "/admin/teachers", label: "Giảng viên", icon: GraduationCap, required: "*" },
		{ to: "/admin/students", label: "Sinh viên", icon: Users, required: "*" },
		{ to: "/admin/instructors", label: "Phân công", icon: UserCog },

		// Hệ thống
		{ to: "/admin/roles", label: "Vai trò", icon: User, required: "role:view" },
		{ to: "/admin/notifications", label: "Thông báo", icon: Bell },
	];


	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};



	return (
		<div className="h-screen flex flex-col">
			{/* Header */}
			<header className="h-16 bg-[#edf3fc] flex-shrink-0 z-40">
				<div className="h-full flex items-center px-6">
					{/* Left Section */}
					<div className="flex items-center gap-4 flex-1">
						{/* Mobile / Collapse Button */}
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
							<div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center">
								<LineChart className="h-6 w-6 text-white" />
							</div>
							<span className="text-xl font-normal text-gray-700">Admin</span>
						</div>
					</div>

					{/* Right Section */}
					<div className="ml-auto flex items-center gap-1">
						{/* User Profile */}
						<button className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
							<div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white text-sm font-medium flex items-center justify-center">
								{user?.fullName?.[0] ?? "A"}
							</div>
						</button>

						{/* Logout */}
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
					<div
						className="fixed inset-0 bg-black/50 z-50 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Sidebar */}
				<aside
					className={`
            fixed lg:static inset-y-0 left-0 z-50 
            ${sidebarCollapsed ? "w-20 lg:w-20" : "w-60 lg:w-60"}
            bg-[#edf3fc] flex-shrink-0
            transform transition-all duration-300 ease-in-out overflow-hidden
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
				>
					{/* Navigation */}
					<div className="flex flex-col h-full">
						<nav className="px-3 py-4 overflow-y-auto flex-1 min-h-0">
							{sidebarMenu.map((item) => {
								if (item.required && !hasPermission(item.required)) return null;
								return (
									<NavLink
										key={item.to}
										to={item.to}
										end={item.end}
										onClick={() => setSidebarOpen(false)}
										className={({ isActive }) =>
											`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
											} py-3 rounded-lg text-sm font-medium transition-all duration-300 group ${isActive
												? "bg-blue-200 text-blue-700"
												: "text-gray-700 hover:bg-blue-200"
											}`
										}
										title={sidebarCollapsed ? item.label : ""}
									>
										<div
											className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-6"
												} ${sidebarCollapsed ? "w-full" : ""}`}
										>
											<item.icon className="h-5 w-5 flex-shrink-0" />
											{!sidebarCollapsed && (
												<span className="whitespace-nowrap overflow-hidden">
													{item.label}
												</span>
											)}
										</div>
									</NavLink>
								);
							})}
						</nav>
					</div>

				</aside>

				{/* Main Content */}
				<main className="flex-1 bg-[#edf3fc] flex flex-col overflow-hidden">
					<div className="flex-1 overflow-y-auto p-3 bg-white rounded-tl-3xl">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
