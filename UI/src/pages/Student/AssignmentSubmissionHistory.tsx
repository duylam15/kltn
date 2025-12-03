import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";
import { ArrowLeft, Clock, Calendar, FileText, AlertCircle } from "lucide-react";
import instance from "../../utils/axiosInstance";

dayjs.extend(relativeTime);
dayjs.locale("vi");

type QuestionType = "multiple_choice" | "essay" | "coding" | "true_false";

interface QuestionChoice {
	id: number;
	questionId: number;
	content: string;
	isCorrect: boolean;
	order: number;
}

interface Question {
	id: number;
	type: QuestionType;
	content: string;
	explanation: string | null;
	points: number;
	order: number;
	choices?: QuestionChoice[];
}

interface SubmissionAnswer {
	id: number;
	submissionId: number;
	questionId: number;
	selectedChoices?: number[];
	essayAnswer?: string;
	codeAnswer?: string;
	language?: string;
	score: number;
	maxScore: number;
	isCorrect: boolean;
	feedback?: string;
	question?: Question;
}

interface TestResult {
	id: number;
	got: string;
	input: string;
	expect: string;
	status: "ok" | "wrong" | "error";
}

interface CodeSubmissionResult {
	id: number;
	submissionId: number;
	questionId: number;
	codeAnswer: string;
	language: string;
	score: number;
	maxScore: number;
	judgeStatus: string;
	compileLog: string | null;
	stdoutLog: string | null;
	stderrLog: string | null;
	testResults: TestResult[];
}

interface Submission {
	id: number;
	assignmentId: number;
	studentId: number;
	score: number | null;
	maxScore: number;
	autoGraded: boolean;
	feedback: string | null;
	submittedAt: string;
	gradedAt: string | null;
	startedAt: string;
	completedAt: string;
	answers?: SubmissionAnswer[];
	codeResults?: CodeSubmissionResult[];
}

interface Assignment {
	id: number;
	title: string;
	description: string | null;
	type: string;
	maxScore: number;
	dueDate: string | null;
	showAnswersAfterSubmit: boolean;
}

export default function AssignmentSubmissionHistory() {
	const { assignmentId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [assignment, setAssignment] = useState<Assignment | null>(null);
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const studentId = user?.student?.id;
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	useEffect(() => {
		if (assignmentId && studentId) {
			fetchData();
		}
	}, [assignmentId, studentId]);

	const fetchData = async () => {
		try {
			setLoading(true);

			// Fetch assignment info
			const assignmentRes = await instance.get(
				`/assignments/${assignmentId}`
			);
			const assignmentData = await assignmentRes.data;
			if (assignmentData.success) {
				setAssignment(assignmentData.data);

				// 🔥 Nếu chưa công bố điểm thì dừng lại
				if (assignmentData.data.showAnswersAfterSubmit === false) {
					setLoading(false);
					return;
				}
			}

			// Fetch submissions
			const submissionsRes = await instance.get(
				`/submissions/assignment/${assignmentId}/student/${studentId}`
			);
			const submissionsData = await submissionsRes.data;
			if (submissionsData.success) {
				const sortedSubmissions = (submissionsData.data || []).sort(
					(a: Submission, b: Submission) =>
						new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
				);
				setSubmissions(sortedSubmissions);

				if (sortedSubmissions.length > 0) {
					await fetchSubmissionDetails(sortedSubmissions[0].id);
				}
			}
		} catch (err) {
			console.error("Error fetching data:", err);
			setError("Không thể tải dữ liệu");
		} finally {
			setLoading(false);
		}
	};

	const fetchSubmissionDetails = async (submissionId: number) => {
		try {
			const answersRes = await instance.get(
				`/submission-answers/submission/${submissionId}`
			);
			const answersData = await answersRes.data;
			const codeResultsRes = await instance.get(
				`/code-submission-results/submission/${submissionId}`
			);
			const codeResultsData = await codeResultsRes.data;

			const answersWithQuestions = await Promise.all(
				(answersData.data || []).map(async (answer: SubmissionAnswer) => {
					try {
						const questionRes = await instance.get(
							`/questions/${answer.questionId}`
						);
						const questionData = await questionRes.data;
						if (questionData.success) {
							return { ...answer, question: questionData.data };
						}
						return answer;
					} catch {
						return answer;
					}
				})
			);

			const submission = submissions.find((s) => s.id === submissionId);
			if (submission) {
				setSelectedSubmission({
					...submission,
					answers: answersWithQuestions.sort(
						(a: SubmissionAnswer, b: SubmissionAnswer) =>
							(a.question?.order || 0) - (b.question?.order || 0)
					),
					codeResults: codeResultsData.data || [],
				});
			}
		} catch (err) {
			console.error("Error fetching submission details:", err);
		}
	};

	const getScorePercent = (score: number, maxScore: number) => {
		return Math.round((score / maxScore) * 100);
	};

	const getScoreColor = (score: number, maxScore: number) => {
		const percent = getScorePercent(score, maxScore);
		if (percent >= 80) return "text-green-600";
		if (percent >= 50) return "text-orange-600";
		return "text-red-600";
	};

	const getScoreBg = (score: number, maxScore: number) => {
		const percent = getScorePercent(score, maxScore);
		if (percent >= 80) return "bg-green-50 border-green-200";
		if (percent >= 50) return "bg-orange-50 border-orange-200";
		return "bg-red-50 border-red-200";
	};

	const canShowAnswers = assignment?.showAnswersAfterSubmit === true;

	const renderAnswerResult = (answer: SubmissionAnswer, index: number) => {
		const question = answer.question;
		if (!question) return null;

		const codeResult = selectedSubmission?.codeResults?.find(
			(cr) => cr.questionId === question.id
		);

		const isCorrectAnswer = answer.isCorrect || answer.score === answer.maxScore;

		return (
			<div
				key={answer.id}
				className={`border-l-4 rounded-lg p-4 bg-white shadow-sm ${isCorrectAnswer ? "border-green-500" : "border-red-500"
					}`}
			>
				{/* Header */}
				<div className="flex items-start justify-between mb-3">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-xs font-semibold text-gray-500">Câu {index + 1}</span>
							<span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
								{question.type === "multiple_choice" && "Trắc nghiệm"}
								{question.type === "essay" && "Tự luận"}
								{question.type === "coding" && "Lập trình"}
								{question.type === "true_false" && "Đúng/Sai"}
							</span>
						</div>
						<p className="text-sm font-medium text-gray-900">{question.content}</p>
					</div>
					<div className="flex items-center gap-2 ml-4">
						{isCorrectAnswer ? (
							<span className="text-green-600 text-xl">✓</span>
						) : (
							<span className="text-red-600 text-xl">✗</span>
						)}
						<span className="text-sm font-bold text-gray-700">
							{answer.score}/{answer.maxScore}
						</span>
					</div>
				</div>

				{/* Multiple Choice */}
				{question.type === "multiple_choice" && question.choices && (
					<div className="space-y-2">
						{question.choices
							.sort((a, b) => a.order - b.order)
							.map((choice, idx) => {
								const label = String.fromCharCode(65 + idx);
								const isSelected = answer.selectedChoices?.includes(choice.id);
								const isCorrect = choice.isCorrect;

								return (
									<div
										key={choice.id}
										className={`flex items-start gap-3 p-3 rounded border ${isCorrect
												? "bg-green-50 border-green-200"
												: isSelected
													? "bg-red-50 border-red-200"
													: "bg-gray-50 border-gray-200"
											}`}
									>
										<span className="font-bold text-sm">{label}.</span>
										<span className="flex-1 text-sm">{choice.content}</span>
										{isSelected && (
											<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
												Đã chọn
											</span>
										)}
										{isCorrect && (
											<span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
												Đáp án
											</span>
										)}
									</div>
								);
							})}
					</div>
				)}

				{/* True/False */}
				{question.type === "true_false" && (
					<div className="space-y-2">
						{[
							{ id: 1, content: "Đúng" },
							{ id: 2, content: "Sai" },
						].map((option, idx) => {
							const label = String.fromCharCode(65 + idx);
							const isSelected = answer.selectedChoices?.includes(option.id);
							const isCorrect = question.choices?.find((c) => c.id === option.id)?.isCorrect;

							return (
								<div
									key={option.id}
									className={`flex items-start gap-3 p-3 rounded border ${isCorrect
											? "bg-green-50 border-green-200"
											: isSelected
												? "bg-red-50 border-red-200"
												: "bg-gray-50 border-gray-200"
										}`}
								>
									<span className="font-bold text-sm">{label}.</span>
									<span className="flex-1 text-sm">{option.content}</span>
									{isSelected && (
										<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
											Đã chọn
										</span>
									)}
									{isCorrect && (
										<span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
											Đáp án
										</span>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* Essay */}
				{question.type === "essay" && (
					<div className="bg-gray-50 rounded p-3">
						<p className="text-xs font-semibold text-gray-600 mb-2">Câu trả lời:</p>
						<p className="text-sm text-gray-900 whitespace-pre-wrap">
							{answer.essayAnswer || "Không có câu trả lời"}
						</p>
						{answer.feedback && (
							<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
								<p className="text-xs font-semibold text-blue-900 mb-1">Nhận xét:</p>
								<p className="text-xs text-blue-800">{answer.feedback}</p>
							</div>
						)}
					</div>
				)}

				{/* Coding */}
				{question.type === "coding" && codeResult && (
					<div>
						<div className="bg-gray-50 rounded p-3 mb-3">
							<div className="flex items-center justify-between mb-2">
								<p className="text-xs font-semibold text-gray-600">Code:</p>
								<span className="text-xs px-2 py-0.5 bg-gray-200 rounded">{codeResult.language}</span>
							</div>
							<pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto font-mono">
								{codeResult.codeAnswer}
							</pre>
						</div>

						{/* Test Results */}
						<div className="bg-white border rounded p-3">
							<div className="flex items-center justify-between mb-3">
								<p className="text-sm font-semibold">Kết quả test</p>
								<span className={`text-sm font-bold ${getScoreColor(codeResult.score, codeResult.maxScore)}`}>
									{codeResult.score}/{codeResult.maxScore}
								</span>
							</div>

							{codeResult.testResults?.map((test, idx) => (
								<div
									key={test.id}
									className={`mb-2 p-2 rounded text-xs ${test.status === "ok" ? "bg-green-50" : "bg-red-50"
										}`}
								>
									<div className="flex items-center justify-between mb-1">
										<span className="font-semibold">Test {idx + 1}</span>
										<span className={test.status === "ok" ? "text-green-600" : "text-red-600"}>
											{test.status === "ok" ? "✓ Pass" : "✗ Fail"}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Explanation */}
				{question.explanation && (
					<div className="mt-3 bg-blue-50 border-l-2 border-blue-400 rounded p-3">
						<p className="text-xs font-semibold text-blue-900 mb-1">💡 Giải thích</p>
						<p className="text-xs text-blue-800">{question.explanation}</p>
					</div>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
					<p className="text-sm text-gray-600">Đang tải...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow max-w-md w-full text-center">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="text-indigo-600 hover:underline text-sm"
					>
						← Quay lại
					</button>
				</div>
			</div>
		);
	}

	if (!canShowAnswers) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
					<div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<span className="text-3xl">🔒</span>
					</div>
					<h2 className="text-xl font-bold text-gray-900 mb-2">Chưa công bố điểm</h2>
					<p className="text-sm text-gray-600 mb-6">
						Giảng viên chưa công bố điểm.  Bạn chưa thể xem lịch sử nộp bài.
					</p>
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition"
					>
						← Quay lại
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b shadow-sm">
				<div className="max-w-6xl mx-auto px-4 ">
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="flex items-center gap-2 text-indigo-600 hover:underline text-sm mb-2"
					>
						<ArrowLeft className="w-4 h-4" />
						Quay lại
					</button>
					<h1 className="text-2xl font-bold text-gray-900">{assignment?.title}</h1>
					<p className="text-sm text-gray-600 mt-1">Lịch sử nộp bài</p>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 py-6">
				{submissions.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<div className="text-4xl mb-3">📝</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có lần nộp bài nào</h3>
						<p className="text-sm text-gray-600 mb-4">Bạn chưa nộp bài tập này</p>
						<button
							onClick={() => navigate(`/student/courses/${sectionId}/assignments/${assignmentId}`)}
							className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition"
						>
							Làm bài ngay
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						{/* Sidebar */}
						<aside className="lg:col-span-1">
							<div className="bg-white rounded-lg shadow p-4">
								<h3 className="font-semibold text-gray-900 mb-3">
									Lần nộp ({submissions.length})
								</h3>
								<div className="space-y-2">
									{submissions.map((sub, idx) => (
										<button
											key={sub.id}
											onClick={() => fetchSubmissionDetails(sub.id)}
											className={`w-full text-left p-3 rounded border transition text-sm ${selectedSubmission?.id === sub.id
													? "bg-indigo-50 border-indigo-300"
													: "bg-white hover:bg-gray-50 border-gray-200"
												}`}
										>
											<div className="flex items-center justify-between mb-1">
												<span className="font-semibold">Lần {submissions.length - idx}</span>
												{sub.score !== null && (
													<span className={`font-bold text-xs ${getScoreColor(sub.score, assignment?.maxScore || sub.maxScore)}`}>
														{sub.score}/{assignment?.maxScore || sub.maxScore}
													</span>
												)}
											</div>
											<div className="text-xs text-gray-600">
												{dayjs(sub.submittedAt).format("DD/MM HH:mm")}
											</div>
										</button>
									))}
								</div>
							</div>
						</aside>

						{/* Main */}
						<main className="lg:col-span-3">
							{selectedSubmission ? (
								<div className="space-y-4">
									{/* Summary */}
									<div className={`rounded-lg shadow p-6 border ${getScoreBg(selectedSubmission.score || 0, assignment?.maxScore || selectedSubmission.maxScore)}`}>
										<div className="flex items-center justify-between mb-4">
											<div>
												<h2 className="text-xl font-bold text-gray-900 mb-2">Kết quả bài làm</h2>
												<div className="flex items-center gap-4 text-xs text-gray-600">
													<span className="flex items-center gap-1">
														<Calendar className="w-3 h-3" />
														{dayjs(selectedSubmission.submittedAt).format("DD/MM/YYYY HH:mm")}
													</span>
													<span className="flex items-center gap-1">
														<Clock className="w-3 h-3" />
														{dayjs(selectedSubmission.completedAt).diff(dayjs(selectedSubmission.startedAt), "minute")} phút
													</span>
												</div>
											</div>
											<div className="text-right">
												<div className={`text-4xl font-bold ${getScoreColor(selectedSubmission.score || 0, assignment?.maxScore || selectedSubmission.maxScore)}`}>
													{selectedSubmission.score || 0}
													<span className="text-xl text-gray-400">/{assignment?.maxScore || selectedSubmission.maxScore}</span>
												</div>
												<div className="text-xs text-gray-600 mt-1">
													{getScorePercent(selectedSubmission.score || 0, assignment?.maxScore || selectedSubmission.maxScore)}%
												</div>
											</div>
										</div>

										{selectedSubmission.feedback && (
											<div className="bg-white rounded border p-3">
												<p className="text-xs font-semibold text-gray-700 mb-1">Nhận xét chung:</p>
												<p className="text-sm text-gray-900">{selectedSubmission.feedback}</p>
											</div>
										)}
									</div>

									{/* Answers */}
									<div>
										<h3 className="font-bold text-gray-900 mb-3">Chi tiết câu trả lời</h3>
										<div className="space-y-3">
											{selectedSubmission.answers?.map((answer, idx) =>
												renderAnswerResult(answer, idx)
											)}
										</div>
									</div>
								</div>
							) : (
								<div className="bg-white rounded-lg shadow p-8 text-center">
									<FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
									<p className="text-sm text-gray-600">Chọn một lần nộp để xem chi tiết</p>
								</div>
							)}
						</main>
					</div>
				)}
			</div>
		</div>
	);
}