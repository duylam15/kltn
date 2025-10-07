import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

interface TeacherRouteProps {
	children: React.ReactNode;
}

const TeacherRoute: React.FC<TeacherRouteProps> = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) return <p>Đang kiểm tra đăng nhập...</p>;
	if (!user) return <Navigate to="/login" replace />;

	const roleId = user.role?.id;

	if (roleId !== 101) {
		if (roleId === 100) return <Navigate to="/student" replace />;
		if (roleId === 102) return <Navigate to="/admin" replace />;
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default TeacherRoute;
