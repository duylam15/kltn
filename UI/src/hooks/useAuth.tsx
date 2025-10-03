import { useEffect, useState } from "react";
import axios from "axios";

interface Permission {
	id: number;
	name: string; // ví dụ: "user:create"
}

interface Role {
	id: number;
	name: string;
	permissions: Permission[];
}
interface Teacher {
	id: number;
	teacherCode: string;
	department: string;
	position: string;
	specialization: string;
}

interface Student {
	id: number;
	className?: string;
	major?: string;
	academicYear?: string;
	enrollmentYear?: number;
	status?: string;
}

interface Role {
	id: number;
	name: string;
	permissions: { id: number; name: string }[];
}

export interface User {
	id: number;
	email: string;
	fullName: string;
	studentCode?: string;
	role: Role;

	// thêm 2 field này
	teacher?: Teacher | null;
	student?: Student | null;
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
				console.log("📌 [ME RESPONSE]", res.data);
				console.log("📌 [useAuth setUser]", res.data.user);

				setUser(res.data.user);
			} catch (err: any) {
				console.error("❌ [ME ERROR]", err.response?.data || err.message);
				setUser(null);
			} finally {
				setLoading(false);
			}
		}
		fetchUser();
	}, []);


	return { user, loading };
}
