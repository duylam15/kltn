import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, Sparkles, AlertTriangle, BookOpen, FileText, Calendar, Award } from "lucide-react";
import dayjs from "dayjs";
import instance from "../../utils/axiosInstance";

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

	const { submission, summary, answers, showAnswersAfterSubmit, payload } = state;

	console.log("🏆 Score Page State:", payload);

	// 🔥 Tạo Map để match score từ payload theo questionId
	const payloadScoreMap = new Map<number, { score: number; maxScore: number }>();

	if (payload?.answers && Array.isArray(payload.answers)) {
		payload.answers.forEach((item: any) => {
			// Chỉ lấy câu có codeAnswer và có score
			if (item.codeAnswer && item.score !== undefined && item.maxScore !== undefined) {
				payloadScoreMap.set(item.questionId, {
					score: item.score,
					maxScore: item.maxScore
				});
			}
		});
	}

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
							const res = await instance.get(
								`/questions-choices/choices/${choiceId}`,
								{ withCredentials: true }
							);
							const data = await res.data;
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
			const res = await instance.post(
				`/assignments/${assignmentId}/recommend-path`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						studentId: submission.studentId,
						score: submission.score,
						sectionId: sectionId,
					}),
				}
			);
			const data = await res.data;
			console.log(data);
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

	// 🔥 Tính toán lại thống kê với điểm từ payload
	const answersWithUpdatedScores = answers?.map((ans: any) => {
		const payloadScore = payloadScoreMap.get(ans.questionId);
		if (payloadScore) {
			return {
				...ans,
				score: payloadScore.score,
				maxScore: payloadScore.maxScore,
				isCorrect: payloadScore.score === payloadScore.maxScore
			};
		}
		return ans;
	}) || [];

	// 🔥 Tính tổng điểm thực tế (cộng dồn từng câu)
	const totalScore = answersWithUpdatedScores.reduce((sum: number, ans: any) => sum + (ans.score || 0), 0);
	const totalMaxScore = answersWithUpdatedScores.reduce((sum: number, ans: any) => sum + (ans.maxScore || 0), 0);

	// 🔥 Tính toán thống kê đúng dựa trên điểm đã cập nhật
	const correctCount = answersWithUpdatedScores.filter((a: any) => a.isCorrect).length;
	const totalCount = answersWithUpdatedScores.length;
	const wrongCount = totalCount - correctCount;
	const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

	// 🔥 Badge màu cho difficulty
	const getDifficultyBadge = (difficulty: string) => {
		const colors: any = {
			REMEDIAL: "bg-yellow-100 text-yellow-700 border-yellow-300",
			NORMAL: "bg-blue-100 text-blue-700 border-blue-300",
			ADVANCED: "bg-purple-100 text-purple-700 border-purple-300",
		};
		const labels: any = {
			REMEDIAL: "Cơ bản",
			NORMAL: "Trung bình",
			ADVANCED: "Nâng cao",
		};
		return (
			<span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[difficulty] || colors.NORMAL}`}>
				{labels[difficulty] || difficulty}
			</span>
		);
	};

	// 🔥 Badge màu cho category
	const getCategoryBadge = (category: string) => {
		const colors: any = {
			lecture: "bg-green-100 text-green-700",
			slide: "bg-blue-100 text-blue-700",
			exercise: "bg-orange-100 text-orange-700",
			reference: "bg-purple-100 text-purple-700",
			syllabus: "bg-pink-100 text-pink-700",
			other: "bg-gray-100 text-gray-700",
		};
		const labels: any = {
			lecture: "Bài giảng",
			slide: "Slide",
			exercise: "Bài tập",
			reference: "Tài liệu tham khảo",
			syllabus: "Giáo trình",
			other: "Khác",
		};
		return (
			<span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[category] || colors.other}`}>
				{labels[category] || category}
			</span>
		);
	};

	// 🔥 Format file size
	const formatFileSize = (bytes: number | null) => {
		if (!bytes) return "N/A";
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

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
					{/* 🔥 Điểm số chính - TÍNH LẠI TỪ PAYLOAD */}
					<div className="text-center mb-6 pb-6 border-b">
						<p className="text-sm text-gray-600 mb-2">Điểm của bạn</p>
						<p className="text-5xl font-bold text-blue-600">
							{totalScore.toFixed(1)}
							<span className="text-2xl text-gray-400">/10</span>
						</p>
						<p className="text-sm text-gray-500 mt-3">
							{dayjs(submission.submittedAt).format("HH:mm - DD/MM/YYYY")}
						</p>
					</div>

					{/* 🔥 Thống kê 3 cột - Đã cập nhật với payload */}
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

						{/* 🔥 Hiển thị recommendation */}
						{recommendation && (
							<div className="mt-4 space-y-4">
								{/* Label + Metrics */}
								<div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
									<div className="flex items-center gap-2 mb-3">
										<Award className="w-5 h-5 text-green-600" />
										<p className="font-bold text-green-900">
											Mức độ học tập: {getDifficultyBadge(recommendation.label)}
										</p>
									</div>
									<div className="grid grid-cols-2 gap-2 text-xs text-green-800">
										<div>📊 Điểm TB: <strong>{recommendation.metrics.avgScore.toFixed(1)}</strong></div>
										<div>📝 Số lần nộp: <strong>{recommendation.metrics.attemptCount}</strong></div>
										<div>⏱️ Thời gian: <strong>{recommendation.metrics.completionTime.toFixed(0)} phút</strong></div>
										<div>📅 Điểm danh: <strong>{(recommendation.metrics.attendanceRate * 100).toFixed(0)}%</strong></div>
									</div>
								</div>

								{/* Bài tập gợi ý */}
								{recommendation.relatedAssignments && recommendation.relatedAssignments.length > 0 && (
									<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
										<div className="flex items-center gap-2 mb-3">
											<BookOpen className="w-5 h-5 text-blue-600" />
											<h3 className="font-bold text-blue-900">Bài tập gợi ý</h3>
										</div>
										<div className="space-y-2">
											{recommendation.relatedAssignments.map((assignment: any) => (
												<div
													key={assignment.id}
													className="bg-white p-3 rounded border hover:shadow-sm transition cursor-pointer"
												>
													<div className="flex items-start justify-between mb-1">
														<p className="font-medium text-gray-900 text-sm flex-1">
															{assignment.title}
														</p>
														{getDifficultyBadge(assignment.difficulty)}
													</div>
													{assignment.description && (
														<p className="text-xs text-gray-600 mb-2 line-clamp-2">
															{assignment.description}
														</p>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{/* Tài liệu gợi ý */}
								{recommendation.relatedMaterials && recommendation.relatedMaterials.length > 0 && (
									<div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
										<div className="flex items-center gap-2 mb-3">
											<FileText className="w-5 h-5 text-purple-600" />
											<h3 className="font-bold text-purple-900">Tài liệu liên quan</h3>
										</div>
										<div className="space-y-2">
											{recommendation.relatedMaterials.map((material: any) => (
												<div
													key={material.id}
													className="bg-white p-3 rounded border hover:shadow-sm transition"
												>
													<div className="flex items-start justify-between mb-1">
														<p className="font-medium text-gray-900 text-sm flex-1">
															{material.title}
														</p>
														{getCategoryBadge(material.category)}
													</div>
													{material.description && (
														<p className="text-xs text-gray-600 mb-2 line-clamp-1">
															{material.description}
														</p>
													)}
													<div className="flex items-center justify-between text-xs text-gray-500">
														<div className="flex items-center gap-2">
															<span>📁 {material.fileName || "Link"}</span>
															<span>• {formatFileSize(material.fileSize)}</span>
														</div>
														{material.uploader && (
															<span className="text-gray-400">
																👤 {material.uploader.fullName}
															</span>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
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
						{answersWithUpdatedScores.map((ans: any, idx: number) => {
							// 🔥 Kiểm tra xem câu này có trong payload không (nếu là câu code)
							const payloadScore = payloadScoreMap.get(ans.questionId);
							const displayScore = ans.score;
							const displayMaxScore = ans.maxScore;
							const isCorrect = ans.isCorrect;

							return (
								<div
									key={ans.answerId}
									className={`bg-white rounded-lg shadow p-4 border-l-4 ${isCorrect ? "border-green-500" : "border-red-500"}`}
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
												{/* 🔥 Badge nếu điểm lấy từ payload */}
												{payloadScore && (
													<span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded">
														✓ Đã chấm code
													</span>
												)}
											</div>
											<p className="text-sm font-medium text-gray-900">
												{ans.questionContent}
											</p>
										</div>
										<div className="flex items-center gap-2 ml-4">
											{isCorrect ? (
												<CheckCircle className="w-5 h-5 text-green-600" />
											) : (
												<XCircle className="w-5 h-5 text-red-600" />
											)}
											<span className="text-sm font-bold text-gray-700">
												{displayScore}/{displayMaxScore}
											</span>
										</div>
									</div>

									{/* Câu trả lời */}
									<div className="bg-gray-50 rounded p-3 mb-3">
										<p className="text-xs font-semibold text-gray-600 mb-2">
											Câu trả lời của bạn:
										</p>

										{/* 🔥 Trắc nghiệm */}
										{ans.questionType === "multiple_choice" && ans.selectedChoices && (
											<div className="space-y-1">
												{ans.selectedChoices.map((choiceId: number) => {
													const label = getChoiceLabel(choiceId, ans.questionId);
													const content = getChoiceContent(choiceId);
													return (
														<div key={choiceId} className="text-sm text-gray-900">
															<span className="font-bold">{label}.  </span> {content}
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
												{ans.judgeStatus && (
													<p className="text-xs text-gray-500 mt-2">
														Trạng thái: {ans.judgeStatus}
													</p>
												)}
											</div>
										)}

										{/* 🔥 Đúng/Sai */}
										{ans.questionType === "true_false" && ans.selectedChoices && (
											<p className="text-sm text-gray-900">
												{ans.selectedChoices.includes(1) ? (
													<span>
														<span className="font-bold">A.  </span> Đúng
													</span>
												) : (
													<span>
														<span className="font-bold">B. </span> Sai
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
							);
						})}
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