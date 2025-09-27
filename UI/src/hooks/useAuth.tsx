// hooks/useAuth.ts
import { useEffect, useState } from "react";
import axios from "axios";

interface User {
	id: string;
	email: string;
	role?: "student" | "teacher" | "admin";
	name: string;
	roleId: number;
}

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchUser() {
			try {
				const res = await axios.get("http://localhost:4000/api/v1/auths/me", {
					withCredentials: true,
				});
				setUser(res.data.user);
			} catch {
				setUser(null);
			} finally {
				setLoading(false);
			}
		}

		fetchUser();
	}, []);

	return { user, loading };
}
