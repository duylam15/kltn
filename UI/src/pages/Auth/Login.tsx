import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, LogIn, User } from "lucide-react";
import axios from "axios";

export default function Login() {
	const navigate = useNavigate();
	const [studentCode, setStudentCode] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		const payload = { studentCode, password };
		console.log("Payload:", payload);

		try {
			const res = await axios.post(
				"http://localhost:4000/api/v1/auths/login", // ❌ bỏ dấu "/" cuối
				payload,
				{ withCredentials: true } // để nhận cookie HttpOnly
			);

			console.log("Login response:", res.data);

			const data = res.data;
			if (!data.success) {
				throw new Error(data.message || "Đăng nhập thất bại");
			}

			// lấy roleId đúng
			const roleId = data.data.roleId ?? data.data.role?.id;
			console.log("roleId:", roleId);

			if (roleId === 100) navigate("/student");
			else if (roleId === 101) navigate("/teacher");
			else if (roleId === 102) navigate("/admin");
			else navigate("/");
		} catch (err: any) {
			console.error("Login error:", err.response?.data || err.message);
			setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
		} finally {
			setLoading(false);
		}
	};


	return (
		<div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 to-white p-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
				<div className="text-center mb-6">
					<h1 className="text-3xl font-bold text-indigo-700">CTIT Learn</h1>
					<p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
				</div>

				<form onSubmit={onSubmit} className="space-y-4">
					{error && (
						<div className="text-red-600 text-sm text-center">{error}</div>
					)}

					<div className="space-y-1">
						<label className="text-sm font-medium">Mã số sinh viên</label>
						<div className="relative">
							<User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={studentCode}
								onChange={(e) => setStudentCode(e.target.value)}
								required
								className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								placeholder="VD: SV1022"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium">Mật khẩu</label>
						<div className="relative">
							<Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								placeholder="••••••••"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 mt-3 text-white py-2.5 hover:bg-indigo-700 disabled:opacity-50"
					>
						{loading ? (
							<span>Đang đăng nhập...</span>
						) : (
							<>
								<LogIn className="h-4 w-4" /> Đăng nhập
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
