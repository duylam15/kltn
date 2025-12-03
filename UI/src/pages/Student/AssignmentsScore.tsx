import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, Sparkles, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";

interface Choice {
	id: number;
	questionId: number;
	content: string;
	isCorrect: boolean;
	order: number;
}

export default function AssignmentsScore() {
	const { state } = useLocation() as { state: any };
	const navigate = useNavigate();
	const { assignmentId } = useParams();
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [recommendation, setRecommendation] = useState<any>(null);
	const [loadingRecommend, setLoadingRecommend] = useState(false);
	const [choicesMap, setChoicesMap] = useState<Map<number, Choice>>(new Map());
	const [loadingChoices, setLoadingChoices] = useState(true);

	const { submission, summary, answers, showAnswersAfterSubmit } = state;

	// 🔥 Fetch tất cả choices khi component mount
	useEffect(() => {
		const fetchAllChoices = async () => {
			if (!answers || answers.length === 0) {
				setLoadingChoices(false);
				return;
			}

			setLoadingChoices(true);

			try {
				const allChoiceIds = new Set<number>();

				answers.forEach((ans: any) => {
					if (Array.isArray(ans.selectedChoices)) {
						ans.selectedChoices.forEach((id: number) =>
							allChoiceIds.add(id)
						);
					}
				});

				const choicesData = await Promise.all(
					[...allChoiceIds].map(async (choiceId) => {
						try {
							const res = await fetch(
								`http://localhost:4000/api/v1/questions-choices/choices/${choiceId}`,
								{ credentials: "include" }
							);
							const data = await res.json();
							return data.success ? data.data : null;
						} catch {
							return null;
						}
					})
				);

				const map = new Map<number, Choice>();
				choicesData.forEach((choice) => {
					if (choice) map.set(choice.id, choice);
				});

				setChoicesMap(map);
			} finally {
				setLoadingChoices(false);
			}
		};

		fetchAllChoices();
	}, [answers]);


	if (!state || !state.submission) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
					<div className="text-5xl mb-4">❌</div>
					<h2 className="text-xl font-bold text-gray-900 mb-2">
						Không tìm thấy kết quả
					</h2>
					<p className="text-gray-600 mb-6 text-sm">
						Bạn không có quyền xem trang này hoặc dữ liệu không tồn tại.
					</p>
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
					>
						← Quay lại
					</button>
				</div>
			</div>
		);
	}


	// 🔥 Nếu showAnswersAfterSubmit = false → chỉ hiển thị điểm tổng
	if (showAnswersAfterSubmit === false) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
					<div className="text-center mb-6">
						<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle className="w-8 h-8 text-blue-600" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Nộp bài thành công!
						</h1>
					</div>

					<div className="bg-blue-50 rounded-lg p-6 text-center mb-6">
						<p className="text-sm text-gray-600 mb-2">Điểm của bạn</p>
						<p className="text-4xl font-bold text-blue-600">
							{submission.score}/10
						</p>
						<p className="text-xs text-gray-500 mt-3">
							{dayjs(submission.submittedAt).format("HH:mm - DD/MM/YYYY")}
						</p>
					</div>

					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
						<div className="flex gap-3">
							<AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
							<div className="text-sm">
								<p className="font-medium text-yellow-900 mb-1">
									Không thể xem đáp án
								</p>
								<p className="text-yellow-700">
									Giảng viên đã tắt chế độ hiển thị đáp án chi tiết.
								</p>
							</div>
						</div>
					</div>

					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="w-full py-2. 5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition"
					>
						← Quay lại danh sách
					</button>
				</div>
			</div>
		);
	}

	// 🔥 Hàm gọi API recommend-path
	const handleRecommendPath = async () => {
		setLoadingRecommend(true);
		try {
			const res = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}/recommend-path`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						studentId: submission.studentId,
						score: submission.score,
					}),
				}
			);
			const data = await res.json();
			if (data.success) {
				setRecommendation(data);
			} else {
				alert("❌ Không thể gợi ý lộ trình học");
			}
		} catch (err) {
			console.error("Error recommending path:", err);
			alert("❌ Lỗi khi gọi gợi ý lộ trình học");
		} finally {
			setLoadingRecommend(false);
		}
	};

	// 🔥 Lấy label (A, B, C, D) từ choiceId dựa trên order
	const getChoiceLabel = (choiceId: number, questionId: number) => {
		// Lấy tất cả choices của câu hỏi này
		const questionChoices = Array.from(choicesMap.values())
			.filter((c) => c.questionId === questionId)
			.sort((a, b) => a.order - b.order);

		const index = questionChoices.findIndex((c) => c.id === choiceId);
		return index >= 0 ? String.fromCharCode(65 + index) : "? ";
	};

	// 🔥 Lấy nội dung choice
	const getChoiceContent = (choiceId: number) => {
		const choice = choicesMap.get(choiceId);
		return choice?.content || `Đang tải...`;
	};

	// 🔥 Tính toán thống kê đúng
	const correctCount = answers?.filter((a: any) => a.isCorrect).length || 0;
	const totalCount = answers?.length || 0;
	const wrongCount = totalCount - correctCount;
	const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	// 🔥 showAnswersAfterSubmit = true → Hiển thị đầy đủ
	return (
		<div className="min-h-screen bg-gray-50 py-6 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-gray-900">Kết quả bài làm</h1>
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="px-4 py-2 bg-white border hover:bg-gray-50 text-gray-700 rounded text-sm font-medium transition flex items-center gap-2"
					>
						<ArrowLeft className="w-4 h-4" />
						Quay lại
					</button>
				</div>

				{/* Score Card */}
				<div className="bg-white rounded-lg shadow p-6 mb-6">
					{/* 🔥 Điểm số chính */}
					<div className="text-center mb-6 pb-6 border-b">
						<p className="text-sm text-gray-600 mb-2">Điểm của bạn</p>
						<p className="text-5xl font-bold text-blue-600">
							{submission.score}
							<span className="text-2xl text-gray-400">/10</span>
						</p>
						<p className="text-sm text-gray-500 mt-3">
							{dayjs(submission.submittedAt).format("HH:mm - DD/MM/YYYY")}
						</p>
					</div>

					{/* 🔥 Thống kê 3 cột - Đã sửa */}
					<div className="grid grid-cols-3 gap-4 mb-6">
						<div className="text-center">
							<p className="text-2xl font-bold text-green-600">{correctCount}</p>
							<p className="text-xs text-gray-500 mt-1">Câu đúng</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-red-600">{wrongCount}</p>
							<p className="text-xs text-gray-500 mt-1">Câu sai</p>
						</div>
						<div className="text-center">
							<p className="text-2xl font-bold text-blue-600">{percentage}%</p>
							<p className="text-xs text-gray-500 mt-1">Tỉ lệ đúng</p>
						</div>
					</div>

					{/* Gợi ý lộ trình */}
					<div className="pt-4 border-t">
						<button
							onClick={handleRecommendPath}
							disabled={loadingRecommend}
							className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm rounded font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
						>
							<Sparkles className="w-4 h-4" />
							{loadingRecommend ? "Đang phân tích..." : "Gợi ý lộ trình học"}
						</button>

						{recommendation && (
							<div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
								<p className="font-semibold text-green-900 text-sm mb-2">
									🎯 {recommendation.label}
								</p>
								<ul className="space-y-1 text-sm text-green-800">
									{recommendation.suggestions?.map((s: string, i: number) => (
										<li key={i} className="flex gap-2">
											<span>•</span>
											<span>{s}</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>

				{/* Chi tiết câu trả lời */}
				<h2 className="text-lg font-bold text-gray-900 mb-4">Chi tiết câu trả lời</h2>

				{loadingChoices ? (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
						<p className="text-sm text-gray-600">Đang tải thông tin câu trả lời...</p>
					</div>
				) : (
					<div className="space-y-3">
						{answers?.map((ans: any, idx: number) => (
							<div
								key={ans.answerId}
								className={`bg-white rounded-lg shadow p-4 border-l-4 ${ans.isCorrect ? "border-green-500" : "border-red-500"
									}`}
							>
								{/* Header */}
								<div className="flex items-start justify-between mb-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs font-semibold text-gray-500">
												Câu {idx + 1}
											</span>
											<span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
												{ans.questionType === "multiple_choice" && "Trắc nghiệm"}
												{ans.questionType === "essay" && "Tự luận"}
												{ans.questionType === "coding" && "Lập trình"}
												{ans.questionType === "true_false" && "Đúng/Sai"}
											</span>
										</div>
										<p className="text-sm font-medium text-gray-900">
											{ans.questionContent}
										</p>
									</div>
									<div className="flex items-center gap-2 ml-4">
										{ans.isCorrect ? (
											<CheckCircle className="w-5 h-5 text-green-600" />
										) : (
											<XCircle className="w-5 h-5 text-red-600" />
										)}
										<span className="text-sm font-bold text-gray-700">
											{ans.score}/{ans.maxScore}
										</span>
									</div>
								</div>

								{/* Câu trả lời */}
								<div className="bg-gray-50 rounded p-3 mb-3">
									<p className="text-xs font-semibold text-gray-600 mb-2">
										Câu trả lời của bạn:
									</p>

									{/* 🔥 Trắc nghiệm - Hiển thị A, B, C, D và nội dung */}
									{ans.questionType === "multiple_choice" && ans.selectedChoices && (
										<div className="space-y-1">
											{ans.selectedChoices.map((choiceId: number) => {
												const label = getChoiceLabel(choiceId, ans.questionId);
												const content = getChoiceContent(choiceId);
												return (
													<div key={choiceId} className="text-sm text-gray-900">
														<span className="font-bold">{label}. </span> {content}
													</div>
												);
											})}
										</div>
									)}

									{/* Tự luận */}
									{ans.questionType === "essay" && (
										<p className="text-sm text-gray-900 whitespace-pre-wrap">
											{ans.essayAnswer || "Không có câu trả lời"}
										</p>
									)}

									{/* Lập trình */}
									{ans.questionType === "coding" && (
										<div>
											<p className="text-xs text-gray-500 mb-2">
												Ngôn ngữ: <span className="font-semibold">{ans.language}</span>
											</p>
											<pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
												{ans.codeAnswer || "Không có code"}
											</pre>
											<p className="text-xs text-gray-500 mt-2">
												Trạng thái: {ans.judgeStatus}
											</p>
										</div>
									)}

									{/* 🔥 Đúng/Sai - Hiển thị A.  Đúng hoặc B. Sai */}
									{ans.questionType === "true_false" && ans.selectedChoices && (
										<p className="text-sm text-gray-900">
											{ans.selectedChoices.includes(1) ? (
												<span>
													<span className="font-bold">A.</span> Đúng
												</span>
											) : (
												<span>
													<span className="font-bold">B.</span> Sai
												</span>
											)}
										</p>
									)}
								</div>

								{/* Giải thích */}
								{ans.explanation && (
									<div className="bg-blue-50 border-l-2 border-blue-400 rounded p-3">
										<p className="text-xs font-semibold text-blue-900 mb-1">
											💡 Giải thích
										</p>
										<p className="text-xs text-blue-800">{ans.explanation}</p>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Footer */}
				<div className="mt-6 text-center">
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="px-6 py-2. 5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded font-medium transition"
					>
						Về trang danh sách
					</button>
				</div>
			</div>
		</div>
	);
}