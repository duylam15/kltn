import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface StudentRouteProps {
	children: React.ReactNode;
}

const StudentRoute: React.FC<StudentRouteProps> = ({ children }) => {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (user.role !== "student") {
		// Redirect to appropriate dashboard based on role
		if (user.role === "teacher") {
			return <Navigate to="/teacher" replace />;
		}
		if (user.role === "admin") {
			return <Navigate to="/admin" replace />;
		}
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

export default StudentRoute;