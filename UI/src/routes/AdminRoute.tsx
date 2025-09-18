import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

interface AdminRouteProps {
	children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (user.role !== "admin") {
		// Redirect to appropriate dashboard based on role
		if (user.role === "student") {
			return <Navigate to="/" replace />;
		}
		if (user.role === "teacher") {
			return <Navigate to="/teacher" replace />;
		}
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default AdminRoute;