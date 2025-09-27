import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles: number[]; // 100 = student, 101 = teacher, 102 = admin
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) return <p>Đang kiểm tra đăng nhập...</p>;

	// Nếu chưa đăng nhập
	if (!user) {
		return <Navigate to="/login" replace />;
	}

	// Nếu role hợp lệ → cho vào
	if (allowedRoles.includes(user.roleId)) {
		return <>{children}</>;
	}

	// Nếu role không hợp lệ → đưa về trang đúng role
	if (user.roleId === 100) return <Navigate to="/student" state={{ from: location }} replace />;
	if (user.roleId === 101) return <Navigate to="/teacher" state={{ from: location }} replace />;
	if (user.roleId === 102) return <Navigate to="/admin" state={{ from: location }} replace />;

	// fallback
	return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
