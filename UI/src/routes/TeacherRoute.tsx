import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface TeacherRouteProps {
	children: React.ReactNode;
}

const TeacherRoute: React.FC<TeacherRouteProps> = ({ children }) => {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (user.role !== "teacher" && user.role !== "admin") {
		// Redirect to appropriate dashboard based on role
		if (user.role === "student") {
			return <Navigate to="/" replace />;
		}
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default TeacherRoute;