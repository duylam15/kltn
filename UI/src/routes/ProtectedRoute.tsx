import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { getRoleRoute, RoleName } from "../constants/roles";
import LoadingScreen from "../components/LoadingScreen";

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles: RoleName[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	allowedRoles
}) => {
	const { user, loading } = useAuth();
	const location = useLocation();

	// Đang load thông tin user
	if (loading) {
		return <LoadingScreen />;
	}

	// Chưa đăng nhập
	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	const userRoleName = user.role?.name?.toLowerCase();

	// Check quyền truy cập
	const hasAccess = allowedRoles.some(
		role => role.toLowerCase() === userRoleName
	);

	if (hasAccess) {
		return <>{children}</>;
	}

	// Không có quyền -> redirect về dashboard của role hiện tại
	const redirectPath = getRoleRoute(userRoleName);

	return (
		<Navigate
			to={redirectPath}
			state={{ from: location, unauthorized: true }}
			replace
		/>
	);
};

export default ProtectedRoute;