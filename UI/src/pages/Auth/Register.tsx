import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Check } from "lucide-react";


export default function Register() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });


	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: call API register → navigate('/login') hoặc auto login
		navigate('/login');
	};


	return (
		<div className="min-h-screen grid place-items-center bg-gradient-to-br from-emerald-50 to-white p-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-6">
				<h1 className="text-2xl font-semibold mb-1">Tạo tài khoản</h1>
				<p className="text-sm text-gray-500 mb-6">Điền thông tin sinh viên/giảng viên</p>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium">Họ và tên</label>
						<div className="relative">
							<User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								required
								className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
								placeholder="Nguyễn Văn A"
							/>
						</div>
					</div>


					<div className="space-y-1">
						<label className="text-sm font-medium">Email</label>
						<div className="relative">
							<Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="email"
								value={form.email}
								onChange={(e) => setForm({ ...form, email: e.target.value })}
								required
								className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
								placeholder="ten.sv@ctit.edu.vn"
							/>
						</div>
					</div>


					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="text-sm font-medium">Mật khẩu</label>
							<div className="relative">
								<Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<input
									type="password"
									value={form.password}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
									required
									className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
									placeholder="••••••••"
								/>
							</div>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium">Xác nhận mật khẩu</label>
							<div className="relative">
								<Check className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<input
									type="password"
									value={form.confirm}
									onChange={(e) => setForm({ ...form, confirm: e.target.value })}
									required
									className="w-full rounded-xl border pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
									placeholder="••••••••"
								/>
							</div>
						</div>
					</div>


					<button type="submit" className="w-full rounded-xl bg-emerald-600 text-white py-2.5 hover:bg-emerald-700">Đăng ký</button>
				</form>


				<p className="text-sm text-gray-600 mt-6 text-center">
					Đã có tài khoản? <a href="/login" className="text-emerald-600 hover:underline">Đăng nhập</a>
				</p>
			</div>
		</div>
	);
}