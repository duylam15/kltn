import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type UserRow = {
	id: string;
	email: string;
	name: string;
	lastLogin?: string; // ISO
	testCount: number;
};

type ApiUsersList = {
	success: boolean;
	message?: string;
	data: {
		total: number;
		page: number;
		limit: number;
		users: UserRow[];
	};
};

const API_BASE = "https://biblio-backend-fastapi.onrender.com/api";

// axios instance + interceptor gắn token
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token") || "";
	if (token) {
		config.headers = config.headers || {};
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

export default function Users() {
	const [filter, setFilter] = useState("");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);

	const [rows, setRows] = useState<UserRow[]>([]);
	const [total, setTotal] = useState(0);

	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	// --- thêm state cho edit/delete ---
	const [editing, setEditing] = useState<UserRow | null>(null);
	const [saving, setSaving] = useState(false);

	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	// --- mở modal sửa ---
	const openEdit = (u: UserRow) => setEditing(u);
	const closeEdit = () => setEditing(null);

	// --- submit cập nhật ---
	type UpdateUserBody = { email: string; name: string; password?: string };

	const submitEdit = async (payload: UpdateUserBody) => {
		if (!editing) return;
		try {
			setSaving(true);
			const res = await api.put(`/admin/users/${editing.id}`, payload);
			if (!res.data?.success) throw new Error(res.data?.message || "Update failed");
			// Cập nhật lại list tại chỗ (optimistic) hoặc refetch
			setRows((prev) =>
				prev.map((r) =>
					r.id === editing.id ? { ...r, email: payload.email, name: payload.name } : r
				)
			);
			closeEdit();
		} catch (e: any) {
			alert(e?.response?.data?.message || e?.message || "Không thể cập nhật");
		} finally {
			setSaving(false);
		}
	};

	// --- confirm xóa mềm ---
	const confirmDelete = (id: string) => setDeletingId(id);
	const cancelDelete = () => setDeletingId(null);

	// --- gọi API xóa mềm ---
	const doDelete = async () => {
		if (!deletingId) return;
		try {
			setDeleting(true);
			const res = await api.delete(`/admin/users/${deletingId}`);
			if (!res.data?.success) throw new Error(res.data?.message || "Delete failed");

			// Xóa khỏi UI (hoặc refetch)
			setRows((prev) => prev.filter((r) => r.id !== deletingId));
			setTotal((t) => Math.max(0, t - 1));
			setDeletingId(null);
		} catch (e: any) {
			alert(e?.response?.data?.message || e?.message || "Không thể xóa");
		} finally {
			setDeleting(false);
		}
	};


	// debounce filter
	const [debounced, setDebounced] = useState(filter);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(filter), 400);
		return () => clearTimeout(id);
	}, [filter]);

	const totalPages = useMemo(
		() => Math.max(1, Math.ceil(total / limit)),
		[total, limit]
	);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			setErr(null);
			const res = await api.get<ApiUsersList>("/admin/users", {
				params: {
					filter: debounced || undefined,
					page,
					limit,
				},
			});
			if (!res.data.success) throw new Error(res.data.message || "Fetch failed");
			setRows(res.data.data.users);
			setTotal(res.data.data.total);
			console.log(rows)

		} catch (e: any) {
			setErr(e?.response?.data?.message || e?.message || "Đã xảy ra lỗi");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced, page, limit]);

	const goPrev = () => setPage((p) => Math.max(1, p - 1));
	const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

	const fmt = (iso?: string) => {
		if (!iso) return "—";
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return "—";
		return d.toLocaleString();
	};

	return (
		<main className="">
			{/* Header + Bộ lọc */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold">Quản trị · Người dùng</h1>
					<p className="text-sm text-gray-600">
						Danh sách người dùng. Tổng: <span className="font-medium">{total}</span>
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Tìm kiếm</label>
						<input
							value={filter}
							onChange={(e) => {
								setFilter(e.target.value);
								setPage(1);
							}}
							placeholder="Tìm theo email / tên…"
							className="h-10 w-56 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Số dòng mỗi trang</label>
						<select
							value={limit}
							onChange={(e) => {
								setLimit(Number(e.target.value));
								setPage(1);
							}}
							className="h-10 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
						>
							{[5, 10, 20, 50].map((n) => (
								<option key={n} value={n}>
									{n} / trang
								</option>
							))}
						</select>
					</div>

					<button
						onClick={fetchUsers}
						className="h-10 px-4 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800"
					>
						Làm mới
					</button>
				</div>
			</div>

			{/* Lỗi */}
			{err && (
				<div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
					{err}
				</div>
			)}

			{/* Bảng (máy tính) */}
			<div className="hidden md:block mt-5">
				<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="bg-gray-50 text-gray-600 text-xs uppercase">
							<tr>
								<th className="px-4 py-3 w-16">#</th>
								<th className="px-4 py-3">Tên</th>
								<th className="px-4 py-3">Email</th>
								<th className="px-4 py-3 w-48">Đăng nhập gần nhất</th>
								<th className="px-4 py-3 w-28">Số bài kiểm tra</th>
								<th className="px-4 py-3 w-36">Hành động</th>
							</tr>
						</thead>

						<tbody>
							{loading
								? [...Array(8)].map((_, i) => (
									<tr key={i} className="border-t">
										<td className="px-4 py-4"><div className="h-4 w-6 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-56 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse" /></td>
									</tr>
								))
								: rows.map((u) => (
									<tr key={u.id} className="border-t hover:bg-gray-50/60">
										<td className="px-4 py-4">{u.id}</td>
										<td className="px-4 py-4">
											<div className="font-medium text-gray-900">{u.name || "—"}</div>
										</td>
										<td className="px-4 py-4">{u.email}</td>
										<td className="px-4 py-4">{fmt(u.lastLogin)}</td>
										<td className="px-4 py-4">{u.testCount ?? 0}</td>
										<td className="px-4 py-4">
											<div className="inline-flex gap-2">
												<button
													onClick={() => openEdit(u)}
													className="h-8 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-xs"
												>
													Sửa
												</button>
												<button
													onClick={() => confirmDelete(u.id)}
													className="h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs"
												>
													Xóa
												</button>
											</div>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</div>

			{editing && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 mt-[0px]"
					onClick={closeEdit}
				>
					<div
						className="w-full max-w-md rounded-xl bg-white p-5"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-lg font-semibold">Sửa người dùng</h3>
						<p className="text-xs text-gray-500 mt-1 break-all">ID: {editing.id}</p>

						<EditForm
							initial={{ email: editing.email, name: editing.name || "" }}
							onCancel={closeEdit}
							onSubmit={submitEdit}
							loading={saving}
						/>
					</div>
				</div>
			)}

			{deletingId && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={cancelDelete}
				>
					<div
						className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-lg font-semibold">Xóa người dùng?</h3>
						<p className="text-sm text-gray-600 mt-2">
							Hành động này là <b>xóa mềm</b>. Bạn chắc chắn muốn tiếp tục?
						</p>

						<div className="mt-4 flex justify-end gap-2">
							<button
								onClick={cancelDelete}
								className="h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
								disabled={deleting}
							>
								Hủy
							</button>
							<button
								onClick={doDelete}
								className="h-10 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
								disabled={deleting}
							>
								{deleting ? "Đang xóa..." : "Xóa"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Thẻ (di động) */}
			<div className="md:hidden grid grid-cols-1 gap-4 mt-5">
				{loading
					? [...Array(5)].map((_, i) => (
						<div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
							<div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
							<div className="mt-2 h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
							<div className="mt-2 h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
						</div>
					))
					: rows.map((u) => (
						<article key={u.id} className="rounded-xl border border-gray-200 bg-white p-4">
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="font-semibold text-gray-900">{u.name || "—"}</h3>
									<p className="text-sm text-gray-600">{u.email}</p>
								</div>
								<span className="">
									<div className="rounded-full text-xs text-gray-700">{u.testCount ?? 0} bài kiểm tra</div>
									<div className="mt-3 flex gap-2">
										<button
											onClick={() => openEdit(u)}
											className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm"
										>
											Sửa
										</button>
										<button
											onClick={() => confirmDelete(u.id)}
											className="h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
										>
											Xóa
										</button>
									</div>
								</span>
							</div>
							<div className="mt-2 text-xs text-gray-500">
								Đăng nhập gần nhất: {fmt(u.lastLogin)}
							</div>
						</article>
					))}
			</div>

			{/* Phân trang */}
			<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-5">
				<div className="text-sm text-gray-600">
					Trang <span className="font-semibold">{page}</span> / {totalPages} ·{" "}
					<span className="font-mono">{total}</span> người dùng
				</div>

				<div className="inline-flex items-center gap-2">
					<button
						onClick={goPrev}
						disabled={page <= 1 || loading}
						className="h-9 px-3 rounded-md border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50"
					>
						Trước
					</button>
					<button
						onClick={goNext}
						disabled={page >= totalPages || loading}
						className="h-9 px-3 rounded-md border border-gray-300 bg-white disabled:opacity-50 hover:bg-gray-50"
					>
						Tiếp
					</button>
				</div>
			</div>
		</main>
	);
}


function EditForm({
	initial,
	onCancel,
	onSubmit,
	loading,
}: {
	initial: { email: string; name: string };
	onCancel: () => void;
	onSubmit: (payload: { email: string; name: string; password?: string }) => void;
	loading: boolean;
}) {
	const [email, setEmail] = useState(initial.email);
	const [name, setName] = useState(initial.name);
	const [password, setPassword] = useState("");

	const canSave =
		email.trim().length > 0 &&
		name.trim().length > 0 &&
		(!password || password.length >= 6); // rule mẫu

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSave || loading) return;
		const body: { email: string; name: string; password?: string } = {
			email: email.trim(),
			name: name.trim(),
		};
		if (password) body.password = password;
		onSubmit(body);
	};

	return (
		<form onSubmit={submit} className="mt-4 space-y-3">
			<div className="flex flex-col gap-1">
				<label className="text-sm text-gray-700">Email</label>
				<input
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
					type="email"
					required
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label className="text-sm text-gray-700">Tên</label>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
					required
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label className="text-sm text-gray-700">Mật khẩu (tùy chọn)</label>
				<input
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
					type="password"
					placeholder="Để trống nếu không đổi"
				/>
				{password && password.length < 6 && (
					<span className="text-xs text-red-600">Mật khẩu tối thiểu 6 ký tự</span>
				)}
			</div>

			<div className="mt-2 flex justify-end gap-2">
				<button
					type="button"
					onClick={onCancel}
					className="h-10 px-4 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
					disabled={loading}
				>
					Hủy
				</button>
				<button
					type="submit"
					disabled={!canSave || loading}
					className="h-10 px-4 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
				>
					{loading ? "Đang lưu..." : "Lưu"}
				</button>
			</div>
		</form>
	);
}
