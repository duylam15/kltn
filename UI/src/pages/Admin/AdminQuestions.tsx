import { useEffect, useMemo, useState } from "react";

/** Types */
type Option = { id?: string; text: string; value: number };
type QuestionType = "multiple_choice" | "likert";
type Question = {
	id: string;
	content: string;
	type: QuestionType;
	options: Option[];
	image: string | null;
	timeLimit: number | null;
};

type ApiList = {
	success: boolean;
	message: string;
	data: { total: number; page: number; limit: number; questions: Question[] };
};

const BASE_URL = "https://biblio-backend-fastapi.onrender.com/api";
// Đổi sang true nếu backend yêu cầu snake_case cho payload
const SEND_SNAKE = true;

/** Helpers */
const authHeaders = () => {
	const token = localStorage.getItem("token") || "";
	return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

const toCamelPayload = (form: FormState) => ({
	testId: form.testId.trim(),
	content: form.content.trim(),
	type: form.type,
	options: form.options.map((o) => ({ text: o.text.trim(), value: Number(o.value) })),
	image: form.image.trim() || null,
	timeLimit: form.timeLimit === "" ? undefined : Number(form.timeLimit),
});

const toSnakePayload = (form: FormState) => ({
	test_id: form.testId.trim(),
	content: form.content.trim(),
	type: form.type,
	options: form.options.map((o) => ({ id: o.id, text: o.text.trim(), value: Number(o.value) })),
	image: form.image.trim() || null,
	time_limit: form.timeLimit === "" ? undefined : Number(form.timeLimit),
});

/** Form state for Add/Edit */
type FormState = {
	mode: "add" | "edit";
	id?: string; // for edit
	testId: string;
	content: string;
	type: QuestionType;
	timeLimit: number | "";
	image: string;
	options: Option[];
};

export default function AdminQuestions() {
	/** List state */
	const [testId, setTestId] = useState("test-001");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [data, setData] = useState<Question[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	/** UI state */
	const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

	/** Form state (Add/Edit) */
	const [form, setForm] = useState<FormState>({
		mode: "add",
		testId: "test-001",
		content: "",
		type: "multiple_choice",
		timeLimit: 60,
		image: "",
		options: [
			{ text: "", value: 1 },
			{ text: "", value: 2 },
		],
	});

	/** Fetch list */
	const fetchQuestions = async () => {
		try {
			setLoading(true);
			setErr(null);
			const url = new URL(`${BASE_URL}/admin/questions`);
			if (testId) url.searchParams.set("testId", testId);
			url.searchParams.set("page", String(page));
			url.searchParams.set("limit", String(limit));
			const res = await fetch(url.toString(), { headers: { Authorization: authHeaders().Authorization } });
			const json: ApiList = await res.json();
			if (!res.ok || json.success === false) throw new Error(json?.message || "Không lấy được danh sách câu hỏi");
			console.log(json.data.questions)
			setData(json.data.questions);
			setTotal(json.data.total);
		} catch (e: any) {
			setErr(e?.message || "Đã xảy ra lỗi");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchQuestions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [testId, page, limit]);

	/** Pagination */
	const goPrev = () => setPage((p) => Math.max(1, p - 1));
	const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

	/** Modals */
	const openAdd = () => {
		setForm({
			mode: "add",
			testId: testId || "test-001",
			content: "",
			type: "multiple_choice",
			timeLimit: 60,
			image: "",
			options: [
				{ text: "", value: 1 },
				{ text: "", value: 2 },
			],
		});
		setModalOpen(true);
	};

	const openEdit = (q: Question) => {
		setForm({
			mode: "edit",
			id: q.id,
			testId: testId || "test-001",
			content: q.content,
			type: q.type,
			timeLimit: q.timeLimit ?? "",
			image: q.image ?? "",
			options: q.options?.map((o) => ({ id: o.id, text: o.text, value: o.value })) || [],
		});
		setModalOpen(true);
	};

	const closeModal = () => setModalOpen(false);

	/** Form handlers */
	const updateOption = (idx: number, patch: Partial<Option>) => {
		setForm((f) => ({
			...f,
			options: f.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
		}));
	};
	const addOption = () => setForm((f) => ({ ...f, options: [...f.options, { text: "", value: f.options.length + 1 }] }));
	const removeOption = (idx: number) => setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));

	const presetLikert = () => {
		setForm((f) => ({
			...f,
			type: "likert",
			options: [
				{ text: "Không quan tâm", value: 1 },
				{ text: "Hơi quan tâm", value: 2 },
				{ text: "Quan tâm vừa phải", value: 3 },
				{ text: "Rất quan tâm", value: 4 },
				{ text: "Cực kỳ quan tâm", value: 5 },
			],
		}));
	};

	const validForm = useMemo(() => {
		if (!form.testId.trim() || !form.content.trim()) return false;
		if (!form.type) return false;
		if (!form.options.length) return false;
		for (const o of form.options) {
			if (!o.text.trim()) return false;
			if (typeof o.value !== "number" || Number.isNaN(o.value)) return false;
		}
		return true;
	}, [form]);

	/** Submit Add/Edit */
	const submitForm = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validForm) {
			setToast({ ok: false, text: "Vui lòng điền đầy đủ & hợp lệ." });
			return;
		}
		try {
			setSaving(true);
			const payload = SEND_SNAKE ? toSnakePayload(form) : toCamelPayload(form);
			const method = form.mode === "add" ? "POST" : "PUT";
			const endpoint =
				form.mode === "add"
					? `${BASE_URL}/admin/questions`
					: `${BASE_URL}/admin/questions/${encodeURIComponent(form.id as string)}`;

			const res = await fetch(endpoint, {
				method,
				headers: authHeaders(),
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!res.ok || json?.success === false) {
				throw new Error(json?.message || `${form.mode === "add" ? "Tạo" : "Cập nhật"} câu hỏi thất bại`);
			}

			setToast({ ok: true, text: json?.message || (form.mode === "add" ? "Đã thêm câu hỏi" : "Đã cập nhật câu hỏi") });
			setModalOpen(false);
			await fetchQuestions(); // refresh list
		} catch (e: any) {
			setToast({ ok: false, text: e?.message || "Đã xảy ra lỗi" });
		} finally {
			setSaving(false);
		}
	};

	/** Delete */
	const deleteQuestion = async (id: string) => {
		if (!confirm("Bạn chắc chắn muốn xoá câu hỏi này?")) return;
		try {
			setDeletingId(id);
			const res = await fetch(`${BASE_URL}/admin/questions/${encodeURIComponent(id)}`, {
				method: "DELETE",
				headers: { Authorization: authHeaders().Authorization },
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok || json?.success === false) {
				throw new Error(json?.message || "Xoá câu hỏi thất bại");
			}
			setToast({ ok: true, text: json?.message || "Đã xoá câu hỏi" });
			await fetchQuestions();
		} catch (e: any) {
			setToast({ ok: false, text: e?.message || "Đã xảy ra lỗi" });
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section className="">
			{/* Toast */}
			{toast && (
				<div
					className={`rounded-lg px-4 py-3 text-sm ${toast.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
						}`}
				>
					{toast.text}
				</div>
			)}

			{/* Header + Controls */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold">Quản trị · Câu hỏi</h1>
					<p className="text-sm text-gray-600">
						Quản lý câu hỏi cho bộ test. Tổng: <span className="font-medium">{total}</span>
					</p>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Mã Test</label>
						<input
							value={testId}
							onChange={(e) => {
								setTestId(e.target.value.trim());
								setPage(1);
							}}
							placeholder="VD: test-001"
							className="h-10 w-40 sm:w-48 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
						/>
					</div>

					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Kích thước trang</label>
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

					<button onClick={fetchQuestions} className="h-10 px-4 rounded-md border border-gray-300 hover:bg-gray-50">
						Làm mới
					</button>

					<button
						onClick={openAdd}
						className="h-10 px-4 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800"
					>
						+ Thêm
					</button>
				</div>
			</div>

			{/* Error */}
			{err && (
				<div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">{err}</div>
			)}

			{/* Table (desktop) */}
			<div className="hidden md:block mt-5">
				<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
					<table className="w-full text-left text-sm">
						<thead className="bg-gray-50 text-gray-600 text-xs uppercase">
							<tr>
								<th className="px-4 py-3 w-16">STT</th>
								<th className="px-4 py-3">Nội dung</th>
								<th className="px-4 py-3 w-40">Loại</th>
								<th className="px-4 py-3 w-40">Tùy chọn</th>
								<th className="px-4 py-3 w-20">Thời gian</th>
								<th className="px-4 py-3 w-20">Hình ảnh</th>
								<th className="px-4 py-3 w-40">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{loading
								? [...Array(5)].map((_, i) => (
									<tr key={i} className="border-t">
										<td className="px-4 py-4"><div className="h-4 w-6 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-4 w-12 bg-gray-200 rounded animate-pulse" /></td>
										<td className="px-4 py-4"><div className="h-9 w-28 bg-gray-200 rounded animate-pulse" /></td>
									</tr>
								))
								: data.map((q, idx) => (
									<tr key={q.id} className="border-t hover:bg-gray-50/60">
										<td className="px-4 py-4 align-top">{(page - 1) * limit + idx + 1}</td>
										<td className="px-4 py-4 align-top">
											<div className="font-medium text-gray-900">{q.content}</div>
											<div className="mt-1 text-gray-600">
												{q.options.slice(0, 3).map((o) => (
													<span key={o.id} className="inline-block mr-2 mb-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
														{o.text}
													</span>
												))}
												{q.options.length > 3 && (
													<span className="text-xs text-gray-500">+{q.options.length - 3} khác</span>
												)}
											</div>
										</td>
										<td className="px-4 py-4 align-top">
											<span
												className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${q.type === "multiple_choice" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
													}`}
											>
												{q.type === "multiple_choice" ? "Trả lời chọn" : "Thang đo"}
											</span>
										</td>
										<td className="px-4 py-4 align-top">{q.options.length}</td>
										<td className="px-4 py-4 align-top">{q.timeLimit ?? "-"}</td>
										<td className="px-4 py-4 align-top">
											{q.image ? (
												<a href={q.image} target="_blank" rel="noreferrer" className="text-slate-700 underline hover:text-slate-900">
													Xem
												</a>
											) : (
												<span className="text-gray-400">Không có</span>
											)}
										</td>
										<td className="px-4 py-4 align-top">
											<div className="inline-flex gap-2">
												<button
													onClick={() => openEdit(q)}
													className="h-9 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
												>
													Sửa
												</button>
												<button
													onClick={() => deleteQuestion(q.id)}
													disabled={deletingId === q.id}
													className="h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
												>
													{deletingId === q.id ? "Đang xóa..." : "Xóa"}
												</button>
											</div>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Cards (mobile) */}
			<div className="md:hidden grid grid-cols-1 gap-4 mt-5">
				{loading
					? [...Array(4)].map((_, i) => (
						<div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
							<div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
							<div className="mt-2 h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
							<div className="mt-2 h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
						</div>
					))
					: data.map((q) => (
						<article key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
							<div className="flex items-start justify-between gap-3">
								<h3 className="font-semibold text-gray-900">{q.content}</h3>
								<span
									className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${q.type === "multiple_choice" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
										}`}
								>
									{q.type === "multiple_choice" ? "Trắc nghiệm" : "Likert"}
								</span>
							</div>

							<div className="mt-2 text-sm text-gray-600">
								<span className="mr-1">Tùy chọn:</span>
								{q.options.slice(0, 3).map((o) => (
									<span key={o.id} className="inline-block mr-2 mb-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
										{o.text}
									</span>
								))}
								{q.options.length > 3 && (
									<span className="text-xs text-gray-500">+{q.options.length - 3}</span>
								)}
							</div>

							<div className="mt-3 flex items-center justify-between">
								<span className="text-xs text-gray-500">Thời gian: {q.timeLimit ?? "-"}</span>
								<div className="inline-flex gap-2">
									<button onClick={() => openEdit(q)} className="h-8 px-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm">
										Sửa
									</button>
									<button
										onClick={() => deleteQuestion(q.id)}
										disabled={deletingId === q.id}
										className="h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 text-sm"
									>
										{deletingId === q.id ? "…" : "Xóa"}
									</button>
								</div>
							</div>
						</article>
					))}
			</div>

			{/* Pagination */}
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
						Tiếp theo
					</button>
				</div>
			</div>

			{/* Modal Add/Edit */}
			{modalOpen && (
				<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center ">
					<div className="absolute inset-0 bg-black/40" onClick={closeModal} />

					<div className="relative w-full sm:w-[640px] max-h-[90vh] overflow-auto bg-white rounded-t-2xl sm:rounded-2xl p-5">
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">
								{form.mode === "add" ? "Thêm câu hỏi" : "Sửa câu hỏi"}
							</h3>
							<button onClick={closeModal} className="h-9 w-9 rounded-md hover:bg-gray-100">✕</button>
						</div>

						<form onSubmit={submitForm} className="mt-3 space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div>
									<label className="block text-sm font-medium mb-1">Mã Test</label>
									<input
										value={form.testId}
										onChange={(e) => setForm((f) => ({ ...f, testId: e.target.value }))}
										className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
										required
									/>
								</div>

								<div>
									<div className="flex items-center justify-between">
										<label className="block text-sm font-medium mb-1">Loại</label>
										<button type="button" onClick={presetLikert} className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50">
											Mẫu Likert 1–5
										</button>
									</div>
									<select
										value={form.type}
										onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as QuestionType }))}
										className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
									>
										<option value="multiple_choice">trắc nghiệm</option>
										<option value="likert">thang đo</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-medium mb-1">Thời gian giới hạn (giây)</label>
									<input
										type="number"
										min={0}
										value={form.timeLimit}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												timeLimit: e.target.value === "" ? "" : Number(e.target.value),
											}))
										}
										className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
										placeholder="VD: 60"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-1">Đường dẫn ảnh (tùy chọn)</label>
									<input
										value={form.image}
										onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
										className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
										placeholder="https://..."
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Nội dung</label>
								<textarea
									value={form.content}
									onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
									rows={3}
									className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
									placeholder="Nhập nội dung câu hỏi…"
									required
								/>
							</div>

							{/* Options */}
							<div>
								<div className="flex items-center justify-between">
									<label className="block text-sm font-medium">Tùy chọn</label>
									<button type="button" onClick={addOption} className="inline-flex items-center rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800">
										+ Thêm tùy chọn
									</button>
								</div>

								<div className="mt-3 space-y-2">
									{form.options.map((opt, idx) => (
										<div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_40px] gap-2 items-center">
											<input
												value={opt.text}
												onChange={(e) => updateOption(idx, { text: e.target.value })}
												placeholder={`Tùy chọn ${idx + 1}`}
												className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
												required
											/>
											<input
												type="number"
												value={opt.value}
												onChange={(e) => updateOption(idx, { value: Number(e.target.value) })}
												className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
												placeholder="Giá trị"
												required
											/>
											<button
												type="button"
												onClick={() => removeOption(idx)}
												className="h-10 inline-flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
												title="Xóa"
											>
												✕
											</button>
										</div>
									))}
									{form.type === "likert" && (
										<p className="text-xs text-gray-500">Thang đo thường 5 mức (1–5). Dùng "Mẫu thang đo 1–5".</p>
									)}
								</div>
							</div>

							<div className="flex flex-col sm:flex-row gap-3 pt-2">
								<button
									type="submit"
									disabled={!validForm || saving}
									className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-medium text-white transition
                    ${validForm && !saving ? "bg-[#2F4C7E] hover:bg-[#263a5f]" : "bg-gray-400 cursor-not-allowed"}
                  `}
								>
									{saving ? "Đang lưu..." : form.mode === "add" ? "Tạo câu hỏi" : "Lưu thay đổi"}
								</button>
								<button
									type="button"
									onClick={closeModal}
									className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 font-medium hover:bg-gray-50"
								>
									Hủy
								</button>
							</div>

							{/* Payload preview */}
							<details className="mt-3">
								<summary className="cursor-pointer text-sm text-gray-600">Xem payload gửi</summary>
								<pre className="mt-2 text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-64">
									{JSON.stringify(SEND_SNAKE ? toSnakePayload(form) : toCamelPayload(form), null, 2)}
								</pre>
							</details>
						</form>
					</div>
				</div>
			)}
		</section>
	);
}