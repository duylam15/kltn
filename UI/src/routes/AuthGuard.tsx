import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import type { JSX } from "react/jsx-runtime";
import instance from "../utils/axiosInstance";

type User = {
	id: number;
	roleId: number;
};

export default function AuthGuard() {
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState<JSX.Element | null>(null);

	useEffect(() => {
		async function checkAuth() {
			try {
				const res = await instance.get("/auths/me", {
					withCredentials: true,
				});

				const user: User = res.data.user;

				if (user.roleId === 100) {
					setElement(<Navigate to="/student" replace />);
				} else if (user.roleId === 101) {
					setElement(<Navigate to="/teacher" replace />);
				} else if (user.roleId === 102) {
					setElement(<Navigate to="/admin" replace />);
				} else {
					setElement(<Navigate to="/login" replace />);
				}
			} catch {
				setElement(<Navigate to="/login" replace />);
			} finally {
				setLoading(false);
			}
		}

		checkAuth();
	}, []);

	if (loading) return <p>Đang kiểm tra đăng nhập...</p>;
	return element;
}
