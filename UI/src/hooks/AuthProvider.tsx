import { AuthContext } from "./useAuth";
import { useState, useEffect} from "react";
interface User {
	id: string;
	name: string;
	email: string;
	role: "student" | "teacher" | "admin";
	avatar?: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check if user is logged in on app start
		const checkAuth = async () => {
			try {
				const token = localStorage.getItem("token");
				if (token) {
					// Verify token with backend
					const response = await fetch("/api/auth/verify", {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});
					if (response.ok) {
						const userData = await response.json();
						setUser(userData);
					} else {
						localStorage.removeItem("token");
					}
				}
			} catch (error) {
				console.error("Auth check failed:", error);
				localStorage.removeItem("token");
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				throw new Error("Login failed");
			}

			const data = await response.json();
			localStorage.setItem("token", data.token);
			setUser(data.user);
		// eslint-disable-next-line no-useless-catch
		} catch (error) {
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, isLoading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};