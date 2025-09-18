import { useEffect, useMemo, useState } from "react";
import axios from "axios";

type PopularCategory = { category: string; percentage: number };
type ReportResponse = {
	success: boolean;
	message?: string;
	data: {
		totalTests: number;
		completionRate: number; // 0..100
		popularCategories: PopularCategory[];
	};
};

const API_BASE = "https://biblio-backend-fastapi.onrender.com/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token") || "";
	if (token) {
		config.headers = config.headers || {};
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

export default function Reports() {
	const [startDate, setStartDate] = useState<string>(() => {
		// mặc định 30 ngày gần đây
		const d = new Date();
		d.setDate(d.getDate() - 30);
		return d.toISOString().slice(0, 10); // yyyy-mm-dd
	});
	const [endDate, setEndDate] = useState<string>(() => {
		const d = new Date();
		return d.toISOString().slice(0, 10);
	});

	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);
	const [data, setData] = useState<ReportResponse["data"] | null>(null);

	const fetchReport = async () => {
		try {
			setLoading(true);
			setErr(null);
			const params = {
				startDate: startDate ? `${startDate}T00:00:00Z` : undefined,
				endDate: endDate ? `${endDate}T23:59:59Z` : undefined,
			};
			const res = await api.get<ReportResponse>("/admin/reports", { params });
			if (!res.data.success) throw new Error(res.data.message || "Lấy báo cáo thất bại");
			setData(res.data.data);
		} catch (e: any) {
			setErr(e?.response?.data?.message || e?.message || "Đã xảy ra lỗi");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchReport();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const maxBar = useMemo(() => {
		if (!data?.popularCategories?.length) return 100;
		return Math.max(...data.popularCategories.map((c) => c.percentage), 100);
	}, [data]);

	return (
		<main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			{/* Phần đầu trang */}
			<header className="flex flex-col gap-3  sm:flex-row sm:items-start sm:justify-between " >
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold ">Báo cáo phân tích</h1>
					<p className="text-sm text-gray-600">Tổng quan hoạt động bài kiểm tra và xu hướng thể loại.</p>
				</div>

				{/* Bộ lọc */}
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Ngày bắt đầu</label>
						<input
							type="date"
							value={startDate}
							max={endDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="h-10 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
						/>
					</div>
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Ngày kết thúc</label>
						<input
							type="date"
							value={endDate}
							min={startDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="h-10 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800/40"
						/>
					</div>
					<button
						onClick={fetchReport}
						className="col-span-2 h-10 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800"
					>
						Làm mới
					</button>
				</div>
			</header>

			{/* Thông báo lỗi */}
			{err && (
				<div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
					{err}
				</div>
			)}

			{/* Khung tải dữ liệu */}
			{loading && (
				<section className="mt-5">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
								<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
								<div className="mt-3 h-8 w-32 bg-gray-200 rounded animate-pulse" />
							</div>
						))}
					</div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
						<div className="rounded-2xl border border-gray-200 bg-white p-5 h-64">
							<div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
							<div className="mt-4 space-y-3">
								{[...Array(5)].map((_, i) => (
									<div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
								))}
							</div>
						</div>
						<div className="rounded-2xl border border-gray-200 bg-white p-5 h-64">
							<div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
							<div className="mt-4 h-40 bg-gray-200 rounded animate-pulse" />
						</div>
					</div>
				</section>
			)}

			{/* Nội dung chính */}
			{!loading && data && (
				<>
					{/* Thẻ KPI */}
					<section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
						<KpiCard title="Tổng số bài kiểm tra" value={data.totalTests.toLocaleString()} />
						<KpiCard
							title="Tỉ lệ hoàn thành"
							value={`${Math.round(data.completionRate)}%`}
							ring={data.completionRate}
						/>
						<KpiCard
							title="Thể loại"
							value={`${data.popularCategories.length}`}
							sub="thể loại phổ biến"
						/>
					</section>

					{/* Biểu đồ */}
					<section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
						{/* Thể loại phổ biến – Thanh ngang */}
						<div className="rounded-2xl border border-gray-200 bg-white p-5">
							<h3 className="text-lg font-semibold">Thể loại phổ biến</h3>
							<p className="text-xs text-gray-500">Tỉ lệ chọn theo thể loại</p>

							{data.popularCategories.length === 0 ? (
								<div className="mt-6 text-sm text-gray-500">Chưa có dữ liệu.</div>
							) : (
								<div className="mt-4 space-y-4">
									{data.popularCategories.map((c) => {
										const width = `${(c.percentage / maxBar) * 100}%`;
										return (
											<div key={c.category}>
												<div className="flex items-center justify-between text-sm">
													<span className="font-medium">{c.category}</span>
													<span className="text-gray-600">{c.percentage}%</span>
												</div>
												<div className="mt-1 h-3 rounded-full bg-gray-100">
													<div
														className="h-3 rounded-full bg-[#2F4C7E]"
														style={{ width }}
														aria-label={`${c.category} ${c.percentage}%`}
													/>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* Vòng hoàn thành – Ring conic */}
						<div className="rounded-2xl border border-gray-200 bg-white p-5">
							<h3 className="text-lg font-semibold">Tổng quan hoàn thành</h3>
							<p className="text-xs text-gray-500">Tỉ lệ hoàn tất bài kiểm tra</p>

							<div className="mt-6 flex items-center justify-center">
								<CompletionRing percent={Math.max(0, Math.min(100, data.completionRate))} />
							</div>

							<div className="mt-4 text-center text-sm text-gray-600">
								Thời gian: <b>{startDate}</b> → <b>{endDate}</b>
							</div>
						</div>
					</section>
				</>
			)}
		</main>
	);
}

/* ------------------------- Components ------------------------- */

function KpiCard({
	title,
	value,
	sub,
	ring,
}: {
	title: string;
	value: string | number;
	sub?: string;
	ring?: number; // nếu có, hiển thị mini ring ở góc
}) {
	return (
		<div className="relative rounded-2xl border border-gray-200 bg-white p-5 overflow-hidden">
			<div className="text-sm text-gray-500">{title}</div>
			<div className="mt-1 text-2xl font-bold">{value}</div>
			{sub && <div className="text-xs text-gray-500">{sub}</div>}

			{typeof ring === "number" && (
				<div className="absolute right-4 top-4">
					<MiniRing percent={ring} />
				</div>
			)}
		</div>
	);
}

function MiniRing({ percent }: { percent: number }) {
	const p = Math.max(0, Math.min(100, Math.round(percent)));
	return (
		<div
			className="w-10 h-10 rounded-full grid place-items-center text-xs font-semibold"
			style={{
				background: `conic-gradient(#2F4C7E ${p * 3.6}deg, #e5e7eb 0deg)`,
			}}
			aria-label={`Hoàn thành ${p}%`}
			title={`${p}%`}
		>
			<div className="w-7 h-7 rounded-full bg-white grid place-items-center">{p}%</div>
		</div>
	);
}

function CompletionRing({ percent }: { percent: number }) {
	const p = Math.max(0, Math.min(100, Math.round(percent)));
	return (
		<div className="flex flex-col items-center">
			<div
				className="w-40 h-40 rounded-full grid place-items-center"
				style={{
					background: `conic-gradient(#2F4C7E ${p * 3.6}deg, #e5e7eb 0deg)`,
				}}
				aria-label={`Hoàn thành ${p}%`}
			>
				<div className="w-28 h-28 rounded-full bg-white grid place-items-center">
					<div className="text-center">
						<div className="text-3xl font-bold">{p}%</div>
						<div className="text-xs text-gray-500 -mt-1">đã hoàn thành</div>
					</div>
				</div>
			</div>
		</div>
	);
}
