import { useAuth } from "../context/authContext";
import { Navigate } from "react-router-dom";

interface RequirePermissionProps {
	children: React.ReactNode;
	permission: string;
	fallback?: React.ReactNode;
}

const RequirePermission: React.FC<RequirePermissionProps> = ({
	children,
	permission,
	fallback
}) => {
	const { user, hasPermission } = useAuth();

	// Wildcard permission (admin có thể làm mọi thứ)
	if (permission === '*' && user?.role?.name?.toLowerCase() === 'admin') {
		return <>{children}</>;
	}

	// Check specific permission
	if (hasPermission(permission)) {
		return <>{children}</>;
	}

	// Fallback hoặc redirect
	if (fallback) {
		return <>{fallback}</>;
	}

	return (
		<div className="p-8 text-center">
			<h2 className="text-2xl font-bold text-red-600 mb-4">
				⛔ Không có quyền truy cập
			</h2>
			<p className="text-gray-600">
				Bạn không có quyền <code className="bg-gray-100 px-2 py-1 rounded">{permission}</code>
			</p>
		</div>
	);
};

export default RequirePermission;