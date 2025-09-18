import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users2, BookCopy, Shield, Settings, FileBarChart2, BadgeCheck } from "lucide-react";


export default function LayoutAdmin() {
	const menu = [
		{ to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
		{ to: "/admin/users", label: "Người dùng", icon: Users2 },
		{ to: "/admin/courses", label: "Môn/Học phần", icon: BookCopy },
		{ to: "/admin/roles", label: "Phân quyền", icon: Shield },
		{ to: "/admin/settings", label: "Cài đặt", icon: Settings },
		{ to: "/admin/reports", label: "Báo cáo", icon: FileBarChart2 },
		{ to: "/admin/profile", label: "Hồ sơ", icon: BadgeCheck },
	];


	return (
		<div className="min-h-screen grid grid-cols-[260px_1fr]">
			<aside className="border-r bg-white p-3 space-y-1">
				<div className="px-2 py-3 text-base font-semibold">CTIT Learn • Admin</div>
				{menu.map((m) => (
					<NavLink
						key={m.to}
						to={m.to}
						end={m.end}
						className={({ isActive }) =>
							`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${isActive ? "bg-sky-50 text-sky-700" : "text-gray-700 hover:bg-gray-50"
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