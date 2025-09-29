import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PublicRouteProps {
	children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) return <p>Đang kiểm tra đăng nhập...</p>;

	// Nếu đã đăng nhập thì không cho vào public routes nữa
	if (user) {
		const roleId = user.role?.id;
		if (roleId === 100) return <Navigate to="/student" replace />;
		if (roleId === 101) return <Navigate to="/teacher" replace />;
		if (roleId === 102) return <Navigate to="/admin" replace />;
	}

	// Nếu chưa đăng nhập thì cho vào public route (login, register)
	return <>{children}</>;
};

export default PublicRoute;
