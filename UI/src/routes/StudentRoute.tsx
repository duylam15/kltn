import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface StudentRouteProps {
	children: React.ReactNode;
}

const StudentRoute: React.FC<StudentRouteProps> = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) return <p>Đang kiểm tra đăng nhập...</p>;

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (user.roleId !== 100) {
		// Nếu user tồn tại nhưng không phải student → đưa về đúng dashboard của họ
		if (user.roleId === 101) return <Navigate to="/teacher" replace />;
		if (user.roleId === 102) return <Navigate to="/admin" replace />;
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default StudentRoute;
