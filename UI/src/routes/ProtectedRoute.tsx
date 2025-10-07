import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles: number[]; // 100 = student, 101 = teacher, 102 = admin
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) return <p>⏳ Đang kiểm tra đăng nhập...</p>;

	// Nếu chưa đăng nhập
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	const roleId = user.role?.id; // 👈 lấy từ user.role.id

	// Nếu role hợp lệ → cho vào
	if (roleId && allowedRoles.includes(roleId)) {
		return <>{children}</>;
	}

	// Nếu role không hợp lệ → đưa về đúng trang role
	if (roleId === 100) return <Navigate to="/student" state={{ from: location }} replace />;
	if (roleId === 101) return <Navigate to="/teacher" state={{ from: location }} replace />;
	if (roleId === 102) return <Navigate to="/admin" state={{ from: location }} replace />;

	// fallback
	return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
