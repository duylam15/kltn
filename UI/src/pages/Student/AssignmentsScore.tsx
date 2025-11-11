import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function AssignmentsScore() {
	const { state } = useLocation() as { state: any };
	const navigate = useNavigate();
	const { sectionId, assignmentId } = useParams();

	const [recommendation, setRecommendation] = useState<any>(null);
	const [loadingRecommend, setLoadingRecommend] = useState(false);

	if (!state || !state.submission) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold text-red-500">
					❌ Không tìm thấy dữ liệu kết quả
				</h2>
				<button
					onClick={() => navigate(-1)}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
				>
					Quay lại
				</button>
			</div>
		);
	}

	const { submission, summary, answers, showAnswersAfterSubmit } = state;

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

	return (
		<div className="p-6 max-w-4xl mx-auto">
			{/* Tiêu đề */}
			<h1 className="text-2xl font-bold mb-4">
				📘 Kết quả: {submission.assignmentTitle}
			</h1>

			{/* Thông tin submission */}
			<div className="bg-white shadow rounded p-4 mb-6">
				<p><strong>Điểm:</strong> {submission.score}/{submission.maxScore}</p>
				<p><strong>Tỉ lệ đúng:</strong> {summary.percentage}%</p>
				<p><strong>Tổng số câu:</strong> {summary.totalQuestions}</p>

				{/* 🔥 Chỉ hiển thị trạng thái nếu showAnswersAfterSubmit = true */}
				{showAnswersAfterSubmit !== false && (
					<p>
						<strong>Trạng thái:</strong>{" "}
						{submission.isPassing ? "✅ Đạt" : "❌ Chưa đạt"}
					</p>
				)}

				<p>
					<strong>Thời gian nộp:</strong>{" "}
					{new Date(submission.submittedAt).toLocaleString()}
				</p>

				{/* Nút recommend */}
				<div className="mt-4">
					<button
						onClick={handleRecommendPath}
						disabled={loadingRecommend}
						className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
					>
						{loadingRecommend ? "⏳ Đang gợi ý..." : "✨ Gợi ý lộ trình học"}
					</button>

					{recommendation && (
						<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
							<p><strong>🎯 Nhãn:</strong> {recommendation.label}</p>
							<ul className="list-disc pl-5 mt-2 space-y-1">
								{recommendation.suggestions?.map((s: string, i: number) => (
									<li key={i}>{s}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</div>

			{/* 🔥 showAnswersAfterSubmit: false => ẩn chi tiết đáp án */}
			{showAnswersAfterSubmit === false && (
				<div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-6">
					<p className="text-yellow-800 font-medium">
						ℹ️ Giảng viên đã tắt chế độ hiển thị đáp án sau khi nộp bài.
					</p>
					<p className="text-yellow-700 text-sm mt-1">
						Bạn chỉ có thể xem câu trả lời của mình, không xem được đáp án đúng hay kết quả đúng/sai.
					</p>
				</div>
			)}

			{/* Chi tiết từng câu trả lời */}
			<h2 className="text-xl font-semibold mb-3">📝 Chi tiết câu trả lời</h2>
			<div className="space-y-4">
				{answers.map((ans: any, idx: number) => (
					<div
						key={ans.answerId}
						className="p-4 rounded shadow bg-white border border-gray-300"
					>
						<h3 className="font-medium">
							Câu {idx + 1}: {ans.questionContent}
						</h3>
						<p><strong>Loại:</strong> {ans.questionType}</p>

						{/* 🔥 Chỉ hiển thị điểm nếu được phép */}
						{showAnswersAfterSubmit !== false && (
							<>
								<p><strong>Điểm:</strong> {ans.score}/{ans.maxScore}</p>
								<p>
									<strong>Trạng thái:</strong>{" "}
									{ans.isCorrect ? "✅ Đúng" : "❌ Sai"}
								</p>
							</>
						)}

						{/* 🔥 Hiển thị câu trả lời của học sinh (không hiển thị đúng/sai) */}
						<div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
							<p className="text-sm font-medium text-gray-700 mb-2">Câu trả lời của bạn:</p>

							{ans.questionType === "multiple_choice" && ans.selectedChoices && (
								<p className="text-sm text-gray-900">
									{ans.selectedChoices.map((choiceId: number) => `Lựa chọn ${choiceId}`).join(", ")}
								</p>
							)}

							{ans.questionType === "essay" && (
								<p className="text-sm text-gray-900 whitespace-pre-wrap">
									{ans.essayAnswer || "Không có câu trả lời"}
								</p>
							)}

							{ans.questionType === "coding" && (
								<>
									<p className="text-sm text-gray-600 mb-1">Ngôn ngữ: {ans.language}</p>
									<pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto font-mono">
										{ans.codeAnswer || "Không có code"}
									</pre>
									{showAnswersAfterSubmit !== false && (
										<p className="text-sm text-gray-600 mt-2">
											⏳ Trạng thái chấm: {ans.judgeStatus}
										</p>
									)}
								</>
							)}

							{ans.questionType === "true_false" && ans.selectedChoices && (
								<p className="text-sm text-gray-900">
									{ans.selectedChoices.includes(1) ? "Đúng" : "Sai"}
								</p>
							)}
						</div>

						{/* 🔥 KHÔNG hiển thị giải thích nếu showAnswersAfterSubmit = false */}
						{showAnswersAfterSubmit !== false && ans.explanation && (
							<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
								<p className="text-sm text-blue-800">
									<strong>Giải thích:</strong> {ans.explanation}
								</p>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Nút điều hướng */}
			<div className="mt-6 flex gap-3">
				<button
					onClick={() =>
						navigate(`/student/courses/${sectionId}/assignments/${assignmentId}`)
					}
					className="px-4 py-2 bg-gray-500 text-white rounded"
				>
					🔙 Quay lại Assignment
				</button>
			</div>
		</div>
	);
}