import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { getRoleRoute } from "../constants/roles";
import LoadingScreen from "../components/LoadingScreen";

interface PublicRouteProps {
	children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return <LoadingScreen message="⏳ Đang tải..." />;
	}

	// Nếu đã đăng nhập, redirect về dashboard của role
	if (user) {
		const redirectPath = getRoleRoute(user.role?.name);
		return <Navigate to={redirectPath} replace />;
	}

	return <>{children}</>;
};

export default PublicRoute;