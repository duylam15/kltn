import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";


export default function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"student" | "teacher" | "admin">("student");


	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: call API auth → set token → redirect theo role
		if (role === "teacher") navigate("/teacher");
		else if (role === "admin") navigate("/admin");
		else navigate("/student");
	};


	return (
		<div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 to-white p-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
				<h1 className="text-2xl font-semibold mb-1">Đăng nhập</h1>
				<p className="text-sm text-gray-500 mb-6">Sử dụng email trường hoặc SSO</p>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium">Email</label>
						<div className="relative">
							<Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								placeholder="ten.sv@ctit.edu.vn"
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


					<div className="space-y-1">
						<label className="text-sm font-medium">Vai trò</label>
						<select
							value={role}
							onChange={(e) => setRole(e.target.value as any)}
							className="w-full rounded-xl border px-3 py-2"
						>
							<option value="student">Sinh viên</option>
							<option value="teacher">Giảng viên</option>
							<option value="admin">Quản trị viên</option>
						</select>
					</div>


					<button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-2.5 hover:bg-indigo-700">
						<LogIn className="h-4 w-4" /> Đăng nhập
					</button>


					<button type="button" className="w-full rounded-xl border py-2.5 hover:bg-gray-50">Đăng nhập với SSO</button>
				</form>


				<p className="text-sm text-gray-600 mt-6 text-center">
					Chưa có tài khoản? <a href="/register" className="text-indigo-600 hover:underline">Đăng ký</a>
				</p>
			</div>
		</div>
	);
}