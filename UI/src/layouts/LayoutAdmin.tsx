import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
	BookOpen,
	Bell,
	ClipboardList,
	LineChart,
	LogOut,
	Home,
	User,
	Settings,
	ChevronDown,
	Menu,
	X,
} from "lucide-react";
import { useState } from "react";
import api from "../utils/axiosInstance";

export default function LayoutAdmin() {
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	// Menu cho Admin
	const sidebarMenu = [
		{ to: "/admin", label: "Báo cáo", icon: LineChart, end: true },
		{ to: "/admin/questions", label: "Câu hỏi", icon: BookOpen },
		{ to: "/admin/notifications", label: "Thông báo", icon: Bell },
		{ to: "/admin/reports", label: "Thống kê", icon: ClipboardList },
		{ to: "/admin/roles", label: "Vai trò", icon: User },
		{ to: "/admin/users", label: "Người dùng", icon: Settings },
	];

	const handleLogout = async () => {
		try {
			await api.post("/auths/logout");
			navigate("/login"); // logout xong quay về login
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	return (
		<div className="h-screen flex flex-col">
			{/* Header */}
			<header className="h-16 bg-[#f8fafd] flex-shrink-0 z-40">
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
						{/* Google Apps grid */}
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
						<button className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
							<div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white text-sm font-medium flex items-center justify-center">
								A
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
            bg-[#f8fafd] flex-shrink-0
            transform transition-all duration-300 ease-in-out overflow-hidden
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
				>
					{/* Mobile Header */}
					<div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
						<div className="flex items-center gap-3">
							<div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
								<LineChart className="h-5 w-5 text-white" />
							</div>
							<span className="font-medium text-gray-900">Admin</span>
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
									`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
									} py-3 rounded-lg text-sm font-medium transition-all duration-300 group overflow-x-hidden ${isActive
										? "bg-blue-100 text-blue-700"
										: "text-gray-700 hover:bg-gray-100"
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
						))}
					</nav>
				</aside>

				{/* Main Content */}
				<main className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
					<div className="flex-1 overflow-y-auto p-3 bg-white rounded-tl-3xl">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
