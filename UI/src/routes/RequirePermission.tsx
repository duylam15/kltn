// components/RequirePermission.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function RequirePermission({
	permission,
	children,
}: {
	permission: string;
	children: React.ReactNode;
}) {
	const { hasPermission, loading } = useAuth();

	if (loading) return <div>Đang kiểm tra quyền...</div>;

	if (!hasPermission(permission)) {
		return <Navigate to="/403" replace />; // hoặc render ra <Error403 />
	}

	return <>{children}</>;
}
