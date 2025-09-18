import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type Book = {
	id: string;
	title: string;
	category: string;
	price: number;
	stock: number;
	location: string;
	cover_image: string;
};

type ApiBooksList = {
	success: boolean;
	message: string;
	data: {
		total: number;
		page: number;
		limit: number;
		books: Book[];
	};
};

const API_BASE = "https://biblio-backend-fastapi.onrender.com/api";

// axios instance gắn token tự động
const api = axios.create({
	baseURL: API_BASE,
});

// interceptor để gắn Authorization
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token") || "";
	if (token) {
		config.headers = config.headers || {};
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

const ADMIN_BOOKS_URL = "/admin/books";
const ADMIN_BOOK_URL = (id: string) => `/admin/books/${encodeURIComponent(id)}`;

export default function AdminBooks() {
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);

	const [rows, setRows] = useState<Book[]>([]);
	const [total, setTotal] = useState(0);

	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Book | null>(null);
	const [deleting, setDeleting] = useState<Book | null>(null);
	const [opMsg, setOpMsg] = useState<{ ok: boolean; text: string } | null>(null);

	const totalPages = useMemo(
		() => Math.max(1, Math.ceil(total / limit)),
		[total, limit]
	);

	const fetchBooks = async () => {
		try {
			setLoading(true);
			setErr(null);
			const res = await axios.get<ApiBooksList>(`${API_BASE}/books`, {
				params: { page, limit },
			});
			if (!res.data.success) throw new Error(res.data.message || "Fetch failed");
			console.log(res.data.data.books)
			setRows(res.data.data.books);
			setTotal(res.data.data.total);
		} catch (e: any) {
			setErr(e?.response?.data?.message || e?.message || "Đã xảy ra lỗi");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBooks();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, limit]);

	const goPrev = () => setPage((p) => Math.max(1, p - 1));
	const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

	const openAdd = () => {
		setEditing(null);
		setFormOpen(true);
	};
	const openEdit = (b: Book) => {
		setEditing(b);
		setFormOpen(true);
	};
	const closeForm = () => setFormOpen(false);

	const handleSaved = (msg?: string) => {
		setFormOpen(false);
		setOpMsg({ ok: true, text: msg || "Lưu thành công" });
		fetchBooks();
	};
	const handleError = (msg: string) => setOpMsg({ ok: false, text: msg });

	const askDelete = (b: Book) => setDeleting(b);
	const cancelDelete = () => setDeleting(null);
	const confirmDelete = async () => {
		if (!deleting) return;
		try {
			const res = await api.delete(ADMIN_BOOK_URL(deleting.id));
			const json = res.data;
			if (json?.success === false) {
				throw new Error(json?.message || "Xoá thất bại");
			}
			setOpMsg({ ok: true, text: json?.message || "Đã xoá sách" });
			setDeleting(null);
			fetchBooks();
		} catch (e: any) {
			setOpMsg({ ok: false, text: e?.response?.data?.message || e?.message || "Xoá thất bại" });
		}
	};

	// --- Search & Sort ---
	type SortKey = "id" | "title" | "category" | "price" | "stock" | "location";
	type SortDir = "asc" | "desc";

	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

	const toggleSort = (key: SortKey) => {
		setSort((prev) => {
			if (!prev || prev.key !== key) return { key, dir: "asc" };
			return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
		});
	};

	// giá trị so sánh theo key
	const getVal = (b: any, key: SortKey) => {
		const v = b[key];
		return typeof v === "string" ? v.toLowerCase() : v;
	};

	// rows sau khi filter + sort (chỉ áp dụng trên rows đang hiển thị trang hiện tại)
	const filteredRows = useMemo(() => {
		const q = search.trim().toLowerCase();
		let base = rows;
		if (q) {
			base = base.filter((b: any) =>
				[b.title, b.category, b.location].some((x: any) =>
					String(x ?? "").toLowerCase().includes(q)
				)
			);
		}
		if (sort) {
			const { key, dir } = sort;
			base = [...base].sort((a, b) => {
				const va = getVal(a, key);
				const vb = getVal(b, key);
				if (va == null && vb == null) return 0;
				if (va == null) return dir === "asc" ? -1 : 1;
				if (vb == null) return dir === "asc" ? 1 : -1;
				if (typeof va === "number" && typeof vb === "number") {
					return dir === "asc" ? va - vb : vb - va;
				}
				// string compare
				return dir === "asc"
					? String(va).localeCompare(String(vb))
					: String(vb).localeCompare(String(va));
			});
		}
		return base;
	}, [rows, search, sort]);


	return (
		<section className="">
			{/* Tiêu đề + Điều khiển */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold">Quản trị · Sách</h1>
					<p className="text-sm text-gray-600">
						Quản lý sách. Tổng: <span className="font-medium">{total}</span>
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Số dòng/trang</label>
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
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Tìm kiếm</label>
						<input
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Tên / Thể loại / Vị trí..."
							className="h-10 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
						/>
					</div>

					<button
						onClick={fetchBooks}
						className="h-10 px-4 rounded-md border border-gray-300 hover:bg-gray-50">
						Làm mới
					</button>

					<button
						onClick={openAdd}
						className="h-10 px-4 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800"
					>
						+ Thêm sách
					</button>
				</div>
			</div>

			{/* Thông báo thao tác */}
			{opMsg && (
				<div
					className={`rounded-lg px-4 py-3 text-sm ${opMsg.ok
						? "bg-emerald-50 text-emerald-700 border border-emerald-200"
						: "bg-red-50 text-red-700 border border-red-200"
						}`}
				>
					{opMsg.text}
				</div>
			)}

			{/* Thông báo lỗi */}
			{err && (
				<div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
					{err}
				</div>
			)}

			{/* Bảng dữ liệu (desktop) */}
			<div className="hidden md:block mt-5">
				<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="bg-gray-50 text-gray-600 text-xs uppercase">
							<tr>
								<th
									className="px-4 py-3 w-16"
									onClick={() => toggleSort("id")}
									aria-sort={
										sort?.key === "id"
											? sort.dir === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
									title="Sắp xếp theo ID"
								>
									<span className="inline-flex items-center gap-1">
										# {sort?.key === "id" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
									</span>
								</th>

								<th
									className="px-4 py-3 cursor-pointer select-none"
									onClick={() => toggleSort("title")}
									aria-sort={
										sort?.key === "title"
											? sort.dir === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
									title="Sắp xếp theo tên"
								>
									<span className="inline-flex items-center gap-1">
										Tên {sort?.key === "title" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
									</span>
								</th>

								<th
									className="px-4 py-3 w-40 cursor-pointer select-none"
									onClick={() => toggleSort("category")}
									aria-sort={
										sort?.key === "category"
											? sort.dir === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
									title="Sắp xếp theo thể loại"
								>
									<span className="inline-flex items-center gap-1">
										Thể loại{" "}
										{sort?.key === "category" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
									</span>
								</th>

								<th
									className="px-4 py-3 w-32 cursor-pointer select-none"
									onClick={() => toggleSort("price")}
									aria-sort={
										sort?.key === "price"
											? sort.dir === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
									title="Sắp xếp theo giá"
								>
									<span className="inline-flex items-center gap-1">
										Giá {sort?.key === "price" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
									</span>
								</th>

								<th
									className="px-4 py-3 w-24 cursor-pointer select-none"
									onClick={() => toggleSort("stock")}
									aria-sort={
										sort?.key === "stock"
											? sort.dir === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
									title="Sắp xếp theo tồn kho"
								>
									<span className="inline-flex items-center gap-1">
										Tồn kho {sort?.key === "stock" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
									</span>
								</th>

								<th
									className="px-4 py-3 w-40 cursor-pointer select-none"
									onClick={() => toggleSort("location")}
									aria-sort={
										sort?.key === "location"
											? sort.dir === "asc"
												? "ascending"
												: "descending"
											: "none"
									}
									title="Sắp xếp theo vị trí"
								>
									<span className="inline-flex items-center gap-1">
										Vị trí{" "}
										{sort?.key === "location" ? (sort.dir === "asc" ? "↑" : "↓") : ""}
									</span>
								</th>

								<th className="px-4 py-3 w-44">Thao tác</th>
							</tr>
						</thead>

						<tbody>
							{loading
								? [...Array(6)].map((_, i) => (
									<tr key={i} className="border-t">
										<td className="px-4 py-4">
											<div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
										</td>
										<td className="px-4 py-4">
											<div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
										</td>
										<td className="px-4 py-4">
											<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
										</td>
										<td className="px-4 py-4">
											<div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
										</td>
										<td className="px-4 py-4">
											<div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
										</td>
										<td className="px-4 py-4">
											<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
										</td>
										<td className="px-4 py-4">
											<div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
										</td>
									</tr>
								))
								: filteredRows.map((b) => (
									<tr key={b.id} className="border-t hover:bg-gray-50/60">
										<td className="px-4 py-4">{b.id}</td>
										<td className="px-4 py-4">
											<div className="font-medium text-gray-900">{b.title}</div>
										</td>
										<td className="px-4 py-4">{b.category}</td>
										<td className="px-4 py-4">{b.price.toFixed(2)}</td>
										<td className="px-4 py-4">{b.stock}</td>
										<td className="px-4 py-4">{b.location}</td>
										<td className="px-4 py-4">
											<div className="inline-flex items-center gap-2">
												<button
													onClick={() => openEdit(b)}
													className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
												>
													Sửa
												</button>
												<button
													onClick={() => askDelete(b)}
													className="h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700"
												>
													Xoá
												</button>
											</div>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Thẻ (mobile) */}
			<div className="md:hidden grid grid-cols-1 gap-4 mt-5">
				{loading
					? [...Array(4)].map((_, i) => (
						<div
							key={i}
							className="rounded-xl border border-gray-200 bg-white p-4"
						>
							<div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
							<div className="mt-2 h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
							<div className="mt-2 h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
						</div>
					))
					: filteredRows.map((b) => (
						<article
							key={b.id}
							className="rounded-xl border border-gray-200 bg-white p-4"
						>
							<h3 className="font-semibold text-gray-900">{b.title}</h3>
							<p className="text-sm text-gray-600 mt-1">
								{b.category} • ${b.price.toFixed(2)}
							</p>
							<p className="text-xs text-gray-500 mt-1">
								Tồn kho: {b.stock} · {b.location}
							</p>
							<div className="mt-3 flex items-center justify-end gap-2">
								<button
									onClick={() => openEdit(b)}
									className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm"
								>
									Sửa
								</button>
								<button
									onClick={() => askDelete(b)}
									className="h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
								>
									Xoá
								</button>
							</div>
						</article>
					))}
			</div>

			{/* Phân trang */}
			<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-5">
				<div className="text-sm text-gray-600">
					Trang <span className="font-semibold">{page}</span> / {totalPages} ·{" "}
					<span className="font-mono">{total}</span> mục
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

			{/* Modal Thêm/Sửa */}
			{formOpen && (
				<BookFormModal
					initial={editing}
					onClose={closeForm}
					onSaved={handleSaved}
					onError={handleError}
				/>
			)}

			{/* Xác nhận xoá */}
			{deleting && (
				<ConfirmDeleteModal
					title="Xoá sách"
					message="Bạn có chắc muốn xoá sách này? Hành động không thể hoàn tác."
					onCancel={cancelDelete}
					onConfirm={confirmDelete}
				/>
			)}
		</section>
	);
}

/* ------------------------- Book Form Modal ------------------------- */

function BookFormModal({
	initial,
	onClose,
	onSaved,
	onError,
}: {
	initial: Book | null;
	onClose: () => void;
	onSaved: (msg?: string) => void;
	onError: (msg: string) => void;
}) {
	const editing = Boolean(initial);

	// ----- state -----
	const [title, setTitle] = useState(initial?.title ?? "");
	const [author, setAuthor] = useState((initial as any)?.author ?? "");
	const [description, setDescription] = useState((initial as any)?.description ?? "");
	const [category, setCategory] = useState(initial?.category ?? "");
	const [price, setPrice] = useState<number | "">(initial ? initial.price : "");
	const [stock, setStock] = useState<number | "">(initial ? initial.stock : "");
	const [location, setLocation] = useState(initial?.location ?? "");
	const [coverFile, setCoverFile] = useState<File | null>(null); // <--- thêm
	const [pageCount, setPageCount] = useState<number | "">((initial as any)?.page_count ?? "");
	const [publishedYear, setPublishedYear] = useState<number | "">((initial as any)?.published_year ?? "");
	const [isbn, setIsbn] = useState((initial as any)?.isbn ?? "");
	const [labels, setLabels] = useState<string>(
		typeof (initial as any)?.labels === "string"
			? (initial as any)?.labels
			: (initial as any)?.labels
				? JSON.stringify((initial as any)?.labels)
				: ""
	);

	const [submitting, setSubmitting] = useState(false);
	const [labelsErr, setLabelsErr] = useState<string | null>(null);

	// ----- helpers -----
	const yearNow = new Date().getFullYear();
	const clampYear = (y: number) => Math.min(yearNow + 5, Math.max(1000, y));

	const requiredFilled =
		title.trim() &&
		author.trim() &&
		category.trim() &&
		(typeof price === "number" || price === "") &&
		(typeof stock === "number" || stock === "") &&
		location.trim();

	const canSubmit = Boolean(requiredFilled) && !labelsErr;


	// validate JSON nhãn khi thay đổi
	const onChangeLabels = (v: string) => {
		setLabels(v);
		if (!v.trim()) {
			setLabelsErr(null);
			return;
		}
		try {
			JSON.parse(v);
			setLabelsErr(null);
		} catch {
			setLabelsErr("Nhãn phải là JSON hợp lệ (ví dụ: {\"preferred_genre\":\"fiction\"}).");
		}
	};

	const submit = async () => {
		if (!canSubmit) return;
		try {
			setSubmitting(true);

			const payload: any = {
				title: title.trim(),
				author: author.trim(),
				description: description.trim(),
				category: category.trim(),
				price: typeof price === "number" ? price : Number(price),
				stock: typeof stock === "number" ? stock : Number(stock),
				location: location.trim(),
				page_count: typeof pageCount === "number" ? pageCount : pageCount === "" ? undefined : Number(pageCount),
				published_year:
					typeof publishedYear === "number"
						? clampYear(publishedYear)
						: publishedYear === ""
							? undefined
							: clampYear(Number(publishedYear)),
				isbn: isbn.trim(),
				// backend mẫu của bạn nhận labels là STRING JSON -> giữ nguyên dạng string
				labels: labels.trim() || undefined,
			};

			// loại undefined để payload gọn
			Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

			const endpoint = editing ? ADMIN_BOOK_URL(initial!.id) : ADMIN_BOOKS_URL;
			const method = editing ? "put" : "post";

			const res = await api[method](endpoint, payload);
			const json = res.data;
			if (json?.success === false) {
				throw new Error(json?.message || `${editing ? "Cập nhật" : "Thêm"} thất bại`);
			}
			const bookId = editing ? initial!.id : json?.data?.id;
			// nếu có chọn file -> upload ảnh
			if (coverFile && bookId) {
				const formData = new FormData();
				formData.append("file", coverFile);

				const token = localStorage.getItem("token");

				const res = await api.post(`/admin/books/${bookId}/upload-cover`, formData, {
					headers: {
						"Content-Type": "multipart/form-data",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
				});
				console.log(res)
			}
			onSaved(json?.message || (editing ? "Đã cập nhật" : "Đã thêm sách"));
		} catch (e: any) {
			onError(e?.response?.data?.message || e?.message || "Đã xảy ra lỗi.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* overlay */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
			{/* dialog */}
			<div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 sm:p-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg sm:text-xl font-bold">
							{editing ? "Sửa sách" : "Thêm sách"}
						</h2>
						<button
							onClick={onClose}
							className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
							aria-label="Đóng"
						>
							✕
						</button>
					</div>

					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">Tên sách *</label>
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="Tên sách mới"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Tác giả *</label>
							<input
								value={author}
								onChange={(e) => setAuthor(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="Tác giả mới"
							/>
						</div>

						<div className="sm:col-span-2">
							<label className="block text-sm font-medium mb-1">Mô tả</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="Mô tả ngắn về sách"
							/>
						</div>

						<div className="sm:col-span-2">
							<label className="block text-sm font-medium mb-1">Ảnh bìa</label>
							<input
								type="file"
								accept="image/*"
								onChange={(e) => {
									const f = e.target.files?.[0] || null;
									setCoverFile(f);
								}}
								className="w-full text-sm"
							/>
							{coverFile && (
								<p className="mt-1 text-xs text-gray-500">
									Đã chọn: {coverFile.name}
								</p>

							)}
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Thể loại *</label>
							<input
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="Ví dụ: fiction, non-fiction…"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Giá (VNĐ)</label>
							<input
								type="number"
								min={0}
								step="1000"
								value={price}
								onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="180000"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Số lượng</label>
							<input
								type="number"
								min={0}
								value={stock}
								onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="15"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Vị trí *</label>
							<input
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="Kệ B2 / Kho / Thành phố"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Số trang</label>
							<input
								type="number"
								min={1}
								value={pageCount}
								onChange={(e) => setPageCount(e.target.value === "" ? "" : Number(e.target.value))}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="400"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">Năm xuất bản</label>
							<input
								type="number"
								min={1000}
								max={yearNow + 5}
								value={publishedYear}
								onChange={(e) =>
									setPublishedYear(e.target.value === "" ? "" : Number(e.target.value))
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="2024"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">ISBN</label>
							<input
								value={isbn}
								onChange={(e) => setIsbn(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
								placeholder="978-0987654321"
							/>
						</div>

						<div className="sm:col-span-2">
							<div className="flex items-center justify-between">
								<label className="block text-sm font-medium mb-1">Nhãn (JSON)</label>
								{labelsErr && (
									<span className="text-xs text-red-600">{labelsErr}</span>
								)}
							</div>
							<textarea
								value={labels}
								onChange={(e) => onChangeLabels(e.target.value)}
								rows={3}
								className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40 ${labelsErr ? "border-red-300" : "border-gray-300"
									}`}
								placeholder='{"preferred_genre":"fiction","complexity_level":"advanced"}'
							/>
						</div>
					</div>

					{/* Nút hành động */}
					<div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
						<button
							onClick={onClose}
							className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 font-medium hover:bg-gray-50"
						>
							Hủy
						</button>
						<button
							disabled={!canSubmit || submitting}
							onClick={submit}
							className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-medium text-white transition
                ${canSubmit && !submitting ? "bg-[#2F4C7E] hover:bg-[#263a5f]" : "bg-gray-400 cursor-not-allowed"}
              `}
						>
							{submitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm sách"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}


/* ------------------------- Confirm Delete Modal ------------------------- */

function ConfirmDeleteModal({
	title,
	message,
	onCancel,
	onConfirm,
}: {
	title: string;
	message: string;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden />
			<div className="relative w-full max-w-md">
				<div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5">
					<h3 className="text-lg font-bold">{title}</h3>
					<p className="mt-2 text-sm text-gray-600">{message}</p>
					<div className="mt-5 flex justify-end gap-3">
						<button
							onClick={onCancel}
							className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 font-medium hover:bg-gray-50"
						>
							Hủy
						</button>
						<button
							onClick={onConfirm}
							className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-4 py-2.5 font-medium hover:bg-red-700"
						>
							Xoá
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
