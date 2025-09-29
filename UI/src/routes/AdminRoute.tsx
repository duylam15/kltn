import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) return <p>⏳ Đang kiểm tra đăng nhập...</p>;
	if (!user) return <Navigate to="/login" replace />;

	if (user.role.id !== 102) {
		if (user.role.id === 100) return <Navigate to="/student" replace />;
		if (user.role.id === 101) return <Navigate to="/teacher" replace />;
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default AdminRoute;
