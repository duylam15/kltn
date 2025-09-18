import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface PublicRouteProps {
	children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (user) {
		// Redirect to appropriate dashboard based on role
		if (user.role === "student") {
			return <Navigate to="/" replace />;
		}
		if (user.role === "teacher") {
			return <Navigate to="/teacher" replace />;
		}
		if (user.role === "admin") {
			return <Navigate to="/admin" replace />;
		}
	}

	return <>{children}</>;
};

export default PublicRoute;