import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	// Ví dụ: lấy token từ localStorage (bạn có thể thay đổi theo context, redux...)
	const isAuthenticated = Boolean(localStorage.getItem('token'));

	if (!isAuthenticated) {
		// Nếu chưa login → chuyển hướng về /login
		return <Navigate to="/login" replace />;
	}

	// Nếu đã login → render children
	return <>{children}</>;
}
