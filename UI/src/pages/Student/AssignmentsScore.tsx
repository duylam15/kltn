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

	const { submission, summary, answers } = state;

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
				<p>
					<strong>Trạng thái:</strong>{" "}
					{submission.isPassing ? "✅ Đạt" : "❌ Chưa đạt"}
				</p>
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

			{/* Chi tiết từng câu trả lời */}
			<h2 className="text-xl font-semibold mb-3">📝 Chi tiết câu trả lời</h2>
			<div className="space-y-4">
				{answers.map((ans: any, idx: number) => (
					<div
						key={ans.answerId}
						className={`p-4 rounded shadow ${ans.isCorrect
								? "bg-green-50 border border-green-300"
								: "bg-red-50 border border-red-300"
							}`}
					>
						<h3 className="font-medium">
							Câu {idx + 1}: {ans.questionContent}
						</h3>
						<p><strong>Loại:</strong> {ans.questionType}</p>
						<p><strong>Điểm:</strong> {ans.score}/{ans.maxScore}</p>
						<p>
							<strong>Trạng thái:</strong>{" "}
							{ans.isCorrect ? "✅ Đúng" : "❌ Sai"}
						</p>
						{ans.questionType === "coding" && (
							<p className="text-sm text-gray-600">
								⏳ Trạng thái chấm: {ans.judgeStatus}
							</p>
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
