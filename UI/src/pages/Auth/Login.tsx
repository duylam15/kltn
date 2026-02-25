// pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, LogIn, User as UserIcon, AlertCircle } from "lucide-react";
import { log } from 'node:console';
import { useAuth } from "../../context/authContext";

export default function Login() {
	const navigate = useNavigate();
	const { login } = useAuth();

	const [studentCode, setStudentCode] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	
	
	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			// ✅ Chỉ gọi login 1 lần và nhận user trả về
			const user = await login(studentCode, password);
			const roleId = user?.role?.id;

			console.log("✅ User logged in, roleId:", roleId);

			// Navigate dựa trên roleId
			if (roleId === 24) {
				navigate("/student", { replace: true });
			} else if (roleId === 23) {
				navigate("/teacher", { replace: true });
			} else if (roleId === 22) {
				navigate("/admin", { replace: true });
			} else {
				navigate("/", { replace: true });
			}
		} catch (err: any) {
			console.error("❌ Login error:", err);
			const errorMessage =
				err?.response?.data?.message ||
				err?.message ||
				"Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-purple-50 to-white p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">
						CL
					</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-2">
						CTIT Learn
					</h1>
					<p className="text-gray-600">
						Hệ thống quản lý học tập trực tuyến
					</p>
				</div>

				<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
						Đăng nhập CICD xxxx
					</h2>

					<form onSubmit={onSubmit} className="space-y-5">
						{error && (
							<div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
								<AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
								<span>{error}</span>
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">
								Mã số sinh viên / Mã giảng viên
							</label>
							<div className="relative">
								<UserIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<input
									id="studentCode"
									type="text"
									value={studentCode}
									onChange={(e) => setStudentCode(e.target.value)}
									required
									disabled={loading}
									className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50"
									placeholder="VD: SV202401"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								Mật khẩu
							</label>
							<div className="relative">
								<Lock className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={loading}
									className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:bg-gray-50"
									placeholder="••••••••"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading || !studentCode || !password}
							className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-3 font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg"
						>
							{loading ? (
								<>
									<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
									</svg>
									<span>Đang đăng nhập...</span>
								</>
							) : (
								<>
									<LogIn className="h-5 w-5" />
									<span>Đăng nhập</span>
								</>
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}