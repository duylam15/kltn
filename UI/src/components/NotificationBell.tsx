import { Bell, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import instance from "../utils/axiosInstance";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/authContext";

dayjs.extend(relativeTime);
dayjs.locale("vi");

type Notification = {
	id: number;
	type: string;
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	sectionId?: number;
	assignmentId?: number;
	chatMessageId?: number;
};

export default function NotificationBell() {
	const [isOpen, setIsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [loading, setLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const { user } = useAuth();

	const unreadCount = notifications.filter((n) => !n.isRead).length;

	// 🔹 Lấy TẤT CẢ thông báo của user
	useEffect(() => {
		const fetchNotifications = async () => {
			if (!user?.id) return;

			setLoading(true);
			try {
				const response = await instance.get(`/notifications/user/${user.id}`);
				if (response.data.success) {
					setNotifications(response.data.data);
				}
			} catch (error) {
				console.error("Lỗi khi lấy thông báo:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchNotifications();
	}, [user?.id]);

	// 🔹 Socket realtime cho thông báo
	useEffect(() => {
		if (!user?.id) return;

		const newSocket = io("https://www.quanlyhoctapsgu.cloud", {
			withCredentials: true,
			transports: ["websocket"],
		});
		setSocket(newSocket);

		newSocket.on("connect", () => {
			newSocket.emit("joinUser", user.id);
			console.log("🔔 Notification socket connected");
		});

		// Lắng nghe thông báo mới
		newSocket.on("newNotification", (notification: Notification) => {
			console.log("🔔 New notification received:", notification);
			setNotifications((prev) => [notification, ...prev]);
		});

		return () => {
			newSocket.disconnect();
		};
	}, [user?.id]);

	// Close dropdown khi click bên ngoài
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// 🔹 Đánh dấu 1 thông báo đã đọc
	const markAsRead = async (id: number, e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
		}

		try {
			await instance.post(`/notifications/mark-read`, {
				notificationIds: [id]
			});
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
			);
		} catch (error) {
			console.error("Lỗi khi đánh dấu đã đọc:", error);
		}
	};

	// 🔹 Đánh dấu tất cả đã đọc
	const markAllAsRead = async () => {
		try {
			await instance.post(`/notifications/mark-read`, {
				notificationIds: "all"
			});
			setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		} catch (error) {
			console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
		}
	};

	// 🔹 Click vào thông báo
	const handleNotificationClick = (notification: Notification) => {
		// Đánh dấu đã đọc nếu chưa đọc
		if (!notification.isRead) {
			markAsRead(notification.id);
		}

		setIsOpen(false);

		// Navigate dựa vào type
		if (notification.type === "assignment" && notification.sectionId) {
			navigate(`/student/courses/${notification.sectionId}/assignments`);
		} else if (notification.type === "system" && notification.sectionId) {
			navigate(`/student/courses/${notification.sectionId}/materials`);
		} else if (notification.type === "chat" && notification.sectionId) {
			navigate(`/student/courses/${notification.sectionId}/chat`);
		}
	};

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "assignment":
				return "📝";
			case "system":
				return "📚";
			case "chat":
				return "💬";
			default:
				return "🔔";
		}
	};

	// Chỉ hiển thị 10 thông báo mới nhất trong dropdown
	const displayedNotifications = notifications.slice(0, 10);

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Bell Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative p-1. 5 md:p-2 rounded-full hover:bg-gray-100 transition-colors"
				title="Thông báo"
			>
				<Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
				{unreadCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center animate-pulse">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown */}
			{isOpen && (
				<div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
					{/* Header */}
					<div className="p-4 border-b border-gray-200 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<h3 className="font-semibold text-gray-800">Thông báo</h3>
							{unreadCount > 0 && (
								<span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
									{unreadCount} mới
								</span>
							)}
						</div>
						{unreadCount > 0 && (
							<button
								onClick={markAllAsRead}
								className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
							>
								<Check className="w-3 h-3" />
								Đọc tất cả
							</button>
						)}
					</div>

					{/* Notifications List */}
					<div className="overflow-y-auto flex-1">
						{loading ? (
							<div className="p-8 text-center text-gray-500">
								<div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
								<p className="mt-2 text-sm">Đang tải... </p>
							</div>
						) : displayedNotifications.length === 0 ? (
							<div className="p-8 text-center text-gray-500">
								<Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
								<p className="text-sm">Không có thông báo nào</p>
							</div>
						) : (
							displayedNotifications.map((notification) => (
								<div
									key={notification.id}
									className={`relative group border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50" : ""
										}`}
								>
									<button
										onClick={() => handleNotificationClick(notification)}
										className="w-full p-4 text-left"
									>
										<div className="flex items-start gap-3">
											<span className="text-2xl flex-shrink-0">
												{getNotificationIcon(notification.type)}
											</span>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-sm text-gray-800 mb-1">
													{notification.title}
												</p>
												<p className="text-xs text-gray-600 line-clamp-2">
													{notification.message}
												</p>
												<p className="text-xs text-gray-400 mt-1">
													{dayjs(notification.createdAt).fromNow()}
												</p>
											</div>
											{!notification.isRead && (
												<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
											)}
										</div>
									</button>

								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}