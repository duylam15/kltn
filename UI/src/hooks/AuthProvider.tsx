import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";

interface User {
	id: string;
	name: string;
	email: string;
	role: "student" | "teacher" | "admin";
	avatar?: string;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (studentCode: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function checkAuth() {
			try {
				const res = await axios.get("http://localhost:4000/api/v1/auths/me", {
					withCredentials: true, // 👈 gửi cookie HttpOnly
				});
				setUser(res.data.user);
			} catch {
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}

		checkAuth();
	}, []);

	const login = async (studentCode: string, password: string) => {
		setIsLoading(true);
		try {
			await axios.post(
				"http://localhost:4000/api/v1/auths/login",
				{ studentCode, password },
				{ withCredentials: true } // cookie set ở đây
			);

			// login xong thì gọi lại /me để lấy user info
			const res = await axios.get("http://localhost:4000/api/v1/auths/me", {
				withCredentials: true,
			});
			setUser(res.data.user);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		await axios.post(
			"http://localhost:4000/api/v1/auths/logout",
			{},
			{ withCredentials: true }
		);
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

// Hook tiện dùng
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
