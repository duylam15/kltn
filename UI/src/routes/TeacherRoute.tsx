import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface TeacherRouteProps {
	children: React.ReactNode;
}

const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) return <p>Đang kiểm tra đăng nhập...</p>;
	if (!user) return <Navigate to="/login" replace />;

	if (user.roleId !== 101) {
		if (user.roleId === 100) return <Navigate to="/student" replace />;
		if (user.roleId === 102) return <Navigate to="/admin" replace />;
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};
export default TeacherRoute;