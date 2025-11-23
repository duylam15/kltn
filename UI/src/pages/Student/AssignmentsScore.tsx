import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, Sparkles, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";

export default function AssignmentsScore() {
	const { state } = useLocation() as { state: any };
	const navigate = useNavigate();
	const { assignmentId } = useParams();
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [recommendation, setRecommendation] = useState<any>(null);
	const [loadingRecommend, setLoadingRecommend] = useState(false);

	// 🔥 Nếu không có state hoặc showAnswersAfterSubmit = false → không được vào trang này
	if (!state || !state.submission) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
				<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="text-6xl mb-4">❌</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Không tìm thấy dữ liệu kết quả
					</h2>
					<p className="text-gray-600 mb-6">
						Bạn không có quyền xem trang này hoặc dữ liệu không tồn tại.
					</p>
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
					>
						← Quay lại danh sách
					</button>
				</div>
			</div>
		);
	}

	const { submission, summary, answers, showAnswersAfterSubmit } = state;

	// 🔥 Nếu showAnswersAfterSubmit = false → chỉ hiển thị điểm tổng rồi redirect
	if (showAnswersAfterSubmit === false) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
				<div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
					<div className="text-center mb-8">
						<div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle className="w-12 h-12 text-blue-600" />
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Nộp bài thành công!
						</h1>
						<p className="text-gray-600">
							Giảng viên không cho phép xem đáp án sau khi nộp bài
						</p>
					</div>

					{/* Chỉ hiển thị điểm tổng */}
					<div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center mb-6">
						<p className="text-lg mb-2">Điểm của bạn</p>
						<p className="text-5xl font-bold">{submission.score}/{submission.maxScore}</p>
						<p className="text-blue-100 mt-2">
							Thời gian nộp: {dayjs(submission.submittedAt).format("HH:mm DD/MM/YYYY")}
						</p>
					</div>

					{/* Thông báo */}
					<div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
							<div>
								<p className="font-medium text-yellow-900">
									Bạn không thể xem chi tiết đáp án
								</p>
								<p className="text-sm text-yellow-700 mt-1">
									Giảng viên đã tắt chế độ hiển thị đáp án. Bạn chỉ có thể xem tổng điểm.
								</p>
							</div>
						</div>
					</div>

					{/* Nút quay lại */}
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
					>
						<ArrowLeft className="w-5 h-5" />
						Quay lại danh sách bài tập
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

	// 🔥 showAnswersAfterSubmit = true → Hiển thị đầy đủ
	return (
		<div className="min-h-screen bg-gray-100 py-8 px-6">
			<div className="max-w-5xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-xl shadow-lg p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-3xl font-bold text-gray-900">
							📘 Kết quả bài làm
						</h1>
						<button
							onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
							className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Quay lại
						</button>
					</div>

					{/* Điểm số */}
					<div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-8 text-white text-center mb-6">
						<div className="flex items-center justify-center gap-4 mb-4">
							{submission.isPassing ? (
								<CheckCircle className="w-12 h-12" />
							) : (
								<XCircle className="w-12 h-12" />
							)}
							<div>
								<p className="text-lg opacity-90">Điểm của bạn</p>
								<p className="text-5xl font-bold">{submission.score}/{submission.maxScore}</p>
							</div>
						</div>
						<div className="flex items-center justify-center gap-6 text-sm opacity-90">
							<span>Tỉ lệ đúng: {summary.percentage}%</span>
							<span>•</span>
							<span>Tổng câu: {summary.totalQuestions}</span>
							<span>•</span>
							<span>{submission.isPassing ? "✅ Đạt" : "❌ Chưa đạt"}</span>
						</div>
					</div>

					{/* Thông tin chi tiết */}
					<div className="grid grid-cols-3 gap-4 mb-6">
						<div className="bg-green-50 rounded-lg p-4 text-center">
							<p className="text-sm text-gray-600 mb-1">Số câu đúng</p>
							<p className="text-2xl font-bold text-green-600">
								{summary.correctAnswers}
							</p>
						</div>
						<div className="bg-red-50 rounded-lg p-4 text-center">
							<p className="text-sm text-gray-600 mb-1">Số câu sai</p>
							<p className="text-2xl font-bold text-red-600">
								{summary.totalQuestions - summary.correctAnswers}
							</p>
						</div>
						<div className="bg-blue-50 rounded-lg p-4 text-center">
							<p className="text-sm text-gray-600 mb-1">Thời gian nộp</p>
							<p className="text-lg font-bold text-blue-600">
								{dayjs(submission.submittedAt).format("HH:mm")}
							</p>
							<p className="text-xs text-gray-500">
								{dayjs(submission.submittedAt).format("DD/MM/YYYY")}
							</p>
						</div>
					</div>

					{/* Gợi ý lộ trình */}
					<div>
						<button
							onClick={handleRecommendPath}
							disabled={loadingRecommend}
							className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
						>
							<Sparkles className="w-5 h-5" />
							{loadingRecommend ? "⏳ Đang phân tích..." : "✨ Gợi ý lộ trình học"}
						</button>

						{recommendation && (
							<div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
								<p className="font-bold text-green-900 mb-2">
									🎯 Nhãn: {recommendation.label}
								</p>
								<ul className="list-disc pl-5 space-y-1 text-sm text-green-800">
									{recommendation.suggestions?.map((s: string, i: number) => (
										<li key={i}>{s}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>

				{/* Chi tiết từng câu */}
				<h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Chi tiết câu trả lời</h2>
				<div className="space-y-4">
					{answers.map((ans: any, idx: number) => (
						<div
							key={ans.answerId}
							className={`p-6 rounded-xl shadow-md border-2 ${ans.isCorrect
									? "bg-green-50 border-green-300"
									: "bg-red-50 border-red-300"
								}`}
						>
							{/* Header câu hỏi */}
							<div className="flex items-start justify-between mb-4">
								<h3 className="font-bold text-lg text-gray-900">
									Câu {idx + 1}: {ans.questionContent}
								</h3>
								<div className="flex items-center gap-2">
									{ans.isCorrect ? (
										<CheckCircle className="w-6 h-6 text-green-600" />
									) : (
										<XCircle className="w-6 h-6 text-red-600" />
									)}
									<span
										className={`px-3 py-1 rounded-full text-sm font-bold ${ans.isCorrect
												? "bg-green-200 text-green-800"
												: "bg-red-200 text-red-800"
											}`}
									>
										{ans.score}/{ans.maxScore} điểm
									</span>
								</div>
							</div>

							{/* Loại câu hỏi */}
							<div className="mb-4">
								<span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
									{ans.questionType === "multiple_choice" && "📋 Trắc nghiệm"}
									{ans.questionType === "essay" && "📝 Tự luận"}
									{ans.questionType === "coding" && "💻 Lập trình"}
									{ans.questionType === "true_false" && "✓✗ Đúng/Sai"}
								</span>
							</div>

							{/* Câu trả lời của học sinh */}
							<div className="mb-4 p-4 bg-white rounded-lg border">
								<p className="text-sm font-semibold text-gray-700 mb-2">
									Câu trả lời của bạn:
								</p>

								{ans.questionType === "multiple_choice" && ans.selectedChoices && (
									<div className="space-y-1">
										{ans.selectedChoices.map((choiceId: number) => (
											<p key={choiceId} className="text-sm text-gray-900">
												• Lựa chọn {choiceId}
											</p>
										))}
									</div>
								)}

								{ans.questionType === "essay" && (
									<p className="text-sm text-gray-900 whitespace-pre-wrap">
										{ans.essayAnswer || "Không có câu trả lời"}
									</p>
								)}

								{ans.questionType === "coding" && (
									<div>
										<p className="text-xs text-gray-600 mb-2">
											Ngôn ngữ: <span className="font-bold">{ans.language}</span>
										</p>
										<pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto font-mono">
											{ans.codeAnswer || "Không có code"}
										</pre>
										<p className="text-xs text-gray-600 mt-2">
											⏳ Trạng thái chấm: {ans.judgeStatus}
										</p>
									</div>
								)}

								{ans.questionType === "true_false" && ans.selectedChoices && (
									<p className="text-sm text-gray-900">
										{ans.selectedChoices.includes(1) ? "✓ Đúng" : "✗ Sai"}
									</p>
								)}
							</div>

							{/* Giải thích (nếu có) */}
							{ans.explanation && (
								<div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
									<p className="text-sm font-semibold text-blue-900 mb-1">
										💡 Giải thích:
									</p>
									<p className="text-sm text-blue-800">{ans.explanation}</p>
								</div>
							)}
						</div>
					))}
				</div>

				{/* Footer */}
				<div className="mt-8 text-center">
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
					>
						🏠 Về trang danh sách bài tập
					</button>
				</div>
			</div>
		</div>
	);
}