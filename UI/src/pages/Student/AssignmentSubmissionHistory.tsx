import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";

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
			const assignmentRes = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}`,
				{ credentials: "include" }
			);
			const assignmentData = await assignmentRes.json();

			if (assignmentData.success) {
				setAssignment(assignmentData.data);

				// 🔥 Nếu chưa công bố điểm thì dừng lại, không fetch submissions
				if (assignmentData.data.showAnswersAfterSubmit === false) {
					setLoading(false);
					return;
				}
			}

			// Fetch submissions
			const submissionsRes = await fetch(
				`http://localhost:4000/api/v1/submissions/assignment/${assignmentId}/student/${studentId}`,
				{ credentials: "include" }
			);
			const submissionsData = await submissionsRes.json();

			if (submissionsData.success) {
				const sortedSubmissions = (submissionsData.data || []).sort(
					(a: Submission, b: Submission) =>
						new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
				);
				setSubmissions(sortedSubmissions);

				// Auto-select the latest submission
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
			// Fetch submission answers
			const answersRes = await fetch(
				`http://localhost:4000/api/v1/submission-answers/submission/${submissionId}`,
				{ credentials: "include" }
			);
			const answersData = await answersRes.json();

			// Fetch code results
			const codeResultsRes = await fetch(
				`http://localhost:4000/api/v1/code-submission-results/submission/${submissionId}`,
				{ credentials: "include" }
			);
			const codeResultsData = await codeResultsRes.json();

			// Fetch questions for each answer
			const answersWithQuestions = await Promise.all(
				(answersData.data || []).map(async (answer: SubmissionAnswer) => {
					try {
						const questionRes = await fetch(
							`http://localhost:4000/api/v1/questions/${answer.questionId}`,
							{ credentials: "include" }
						);
						const questionData = await questionRes.json();

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

	const getScoreColor = (score: number, maxScore: number) => {
		const percent = (score / maxScore) * 100;
		if (percent >= 80) return "text-green-600";
		if (percent >= 50) return "text-orange-600";
		return "text-red-600";
	};

	const getScoreBgColor = (score: number, maxScore: number) => {
		const percent = (score / maxScore) * 100;
		if (percent >= 80) return "bg-green-50 border-green-200";
		if (percent >= 50) return "bg-orange-50 border-orange-200";
		return "bg-red-50 border-red-200";
	};

	// 🔥 Kiểm tra xem có được phép hiển thị đáp án không
	const canShowAnswers = assignment?.showAnswersAfterSubmit === true;

	const renderAnswerResult = (answer: SubmissionAnswer, index: number) => {
		const question = answer.question;
		if (!question) return null;

		const codeResult = selectedSubmission?.codeResults?.find(
			(cr) => cr.questionId === question.id
		);

		return (
			<div
				key={answer.id}
				className={`border rounded-lg p-5 ${answer.isCorrect || answer.score === answer.maxScore
					? "bg-green-50 border-green-200"
					: "bg-red-50 border-red-200"
					}`}
			>
				{/* Question Header */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<span
								className={`text-white text-sm font-medium px-3 py-1 rounded ${answer.isCorrect || answer.score === answer.maxScore
									? "bg-green-600"
									: "bg-red-600"
									}`}
							>
								Câu {index + 1}
							</span>
							<span className="text-sm font-medium">
								{answer.score} / {answer.maxScore} điểm
							</span>
							{question.type === "coding" && (
								<span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
									💻 Code
								</span>
							)}
							{answer.isCorrect || answer.score === answer.maxScore ? (
								<span className="text-green-600 font-medium">✓ Đúng</span>
							) : (
								<span className="text-red-600 font-medium">✗ Sai</span>
							)}
						</div>
						<p className="text-gray-900 font-medium mb-2">{question.content}</p>
					</div>
				</div>

				{/* Multiple Choice Answer */}
				{question.type === "multiple_choice" && question.choices && (
					<div className="space-y-2">
						{question.choices
							.sort((a, b) => a.order - b.order)
							.map((choice) => {
								const isSelected = answer.selectedChoices?.includes(choice.id);
								const isCorrect = choice.isCorrect;

								let bgColor = "bg-white";
								let icon = "";

								if (isCorrect) {
									bgColor = "bg-green-100";
									icon = "✓";
								}
								if (isSelected && !isCorrect) {
									bgColor = "bg-red-100";
									icon = "✗";
								}
								if (isSelected && isCorrect) {
									icon = "✓";
								}

								return (
									<div
										key={choice.id}
										className={`flex items-center gap-3 p-3 border rounded ${bgColor}`}
									>
										<span className="font-medium text-lg w-6">{icon}</span>
										<span className="flex-1">{choice.content}</span>
										{isCorrect && (
											<span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
												Đáp án đúng
											</span>
										)}
									</div>
								);
							})}
					</div>
				)}

				{/* True/False Answer */}
				{question.type === "true_false" && (
					<div className="space-y-2">
						{[
							{ id: 1, content: "Đúng", value: true },
							{ id: 2, content: "Sai", value: false },
						].map((option) => {
							const isSelected = answer.selectedChoices?.includes(option.id);
							const isCorrect = question.choices?.find((c) => c.id === option.id)?.isCorrect;

							let bgColor = "bg-white";
							let icon = "";

							if (isCorrect) {
								bgColor = "bg-green-100";
								icon = "✓";
							}
							if (isSelected && !isCorrect) {
								bgColor = "bg-red-100";
								icon = "✗";
							}
							if (isSelected && isCorrect) {
								icon = "✓";
							}

							return (
								<div
									key={option.id}
									className={`flex items-center gap-3 p-3 border rounded ${bgColor}`}
								>
									<span className="font-medium text-lg w-6">{icon}</span>
									<span className="flex-1">{option.content}</span>
									{isCorrect && (
										<span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
											Đáp án đúng
										</span>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* Essay Answer */}
				{question.type === "essay" && (
					<div>
						<div className="mb-2">
							<span className="text-sm font-medium text-gray-700">Câu trả lời của bạn:</span>
						</div>
						<div className="bg-white border rounded p-3 whitespace-pre-wrap">
							{answer.essayAnswer || <span className="text-gray-400">Không có câu trả lời</span>}
						</div>
						{answer.feedback && (
							<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
								<p className="text-sm font-medium text-blue-900 mb-1">Nhận xét:</p>
								<p className="text-sm text-blue-800">{answer.feedback}</p>
							</div>
						)}
					</div>
				)}

				{/* Coding Answer */}
				{question.type === "coding" && codeResult && (
					<div>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-medium text-gray-700">Code của bạn:</span>
							<span className="text-xs px-2 py-1 bg-gray-200 rounded">{codeResult.language}</span>
						</div>
						<pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm font-mono">
							{codeResult.codeAnswer}
						</pre>

						{/* Code Results */}
						<div className="mt-4 p-4 bg-white rounded border">
							<div className="flex items-center justify-between mb-3">
								<h4 className="font-medium text-gray-900">Kết quả Test</h4>
								<div className="flex items-center gap-2">
									<span className={`text-lg font-bold ${getScoreColor(codeResult.score, codeResult.maxScore)}`}>
										{codeResult.score} / {codeResult.maxScore} điểm
									</span>
									<span
										className={`text-xs px-2 py-1 rounded ${codeResult.judgeStatus === "accepted"
											? "bg-green-100 text-green-700"
											: "bg-red-100 text-red-700"
											}`}
									>
										{codeResult.judgeStatus}
									</span>
								</div>
							</div>

							{codeResult.compileLog && (
								<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
									<p className="text-xs font-medium text-red-700 mb-1">Compile Error:</p>
									<pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
										{codeResult.compileLog}
									</pre>
								</div>
							)}

							{codeResult.stderrLog && (
								<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
									<p className="text-xs font-medium text-red-700 mb-1">Runtime Error:</p>
									<pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
										{codeResult.stderrLog}
									</pre>
								</div>
							)}

							{codeResult.testResults && codeResult.testResults.length > 0 && (
								<div className="space-y-2">
									<p className="text-sm font-medium text-gray-700">Test Cases:</p>
									{codeResult.testResults.map((test, index) => (
										<div
											key={test.id}
											className={`p-3 rounded border ${test.status === "ok"
												? "bg-green-50 border-green-200"
												: "bg-red-50 border-red-200"
												}`}
										>
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm font-medium">Test Case {index + 1}</span>
												<span
													className={`text-xs px-2 py-1 rounded ${test.status === "ok"
														? "bg-green-100 text-green-700"
														: "bg-red-100 text-red-700"
														}`}
												>
													{test.status === "ok" ? "✓ Passed" : "✗ Failed"}
												</span>
											</div>
											<div className="grid grid-cols-3 gap-2 text-xs">
												<div>
													<p className="font-medium text-gray-600 mb-1">Input:</p>
													<pre className="bg-white p-2 rounded border font-mono">
														{test.input}
													</pre>
												</div>
												<div>
													<p className="font-medium text-gray-600 mb-1">Expected:</p>
													<pre className="bg-white p-2 rounded border font-mono">
														{test.expect}
													</pre>
												</div>
												<div>
													<p className="font-medium text-gray-600 mb-1">Got:</p>
													<pre
														className={`bg-white p-2 rounded border font-mono ${test.status === "ok" ? "text-green-600" : "text-red-600"
															}`}
													>
														{test.got}
													</pre>
												</div>
											</div>
										</div>
									))}
								</div>
							)}

							{codeResult.stdoutLog && (
								<div className="mt-3 p-3 bg-gray-100 rounded">
									<p className="text-xs font-medium text-gray-700 mb-1">Output:</p>
									<pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
										{codeResult.stdoutLog}
									</pre>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Explanation */}
				{question.explanation && (
					<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
						<p className="text-sm font-medium text-blue-900 mb-1">💡 Giải thích:</p>
						<p className="text-sm text-blue-800 whitespace-pre-wrap">{question.explanation}</p>
					</div>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
					<p className="text-gray-600">Đang tải...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="text-indigo-600 hover:underline"
					>
						Quay lại danh sách bài tập
					</button>
				</div>
			</div>
		);
	}

	// 🔥 Nếu chưa công bố điểm → Hiển thị thông báo
	if (!canShowAnswers) {
		return (
			<div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
				<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<span className="text-4xl">🔒</span>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Chưa công bố điểm
					</h2>
					<p className="text-gray-600 mb-6">
						Giảng viên chưa công bố điểm cho bài tập này. Bạn chưa thể xem chi tiết đáp án và lịch sử nộp bài.
					</p>
					<div className="space-y-3">
						<button
							onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
							className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
						>
							← Quay lại danh sách bài tập
						</button>
						<button
							onClick={() => window.location.reload()}
							className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
						>
							🔄 Làm mới trang
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b sticky top-0 z-20 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<button
						onClick={() => navigate(`/student/courses/${sectionId}/assignments`)}
						className="text-indigo-600 hover:underline text-sm mb-2"
					>
						← Quay lại danh sách bài tập
					</button>
					<h1 className="text-2xl font-bold text-gray-900">{assignment?.title}</h1>
					<p className="text-sm text-gray-600 mt-1">Lịch sử nộp bài</p>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-8">
				{submissions.length === 0 ? (
					<div className="bg-white border rounded-lg p-8 text-center">
						<div className="text-3xl mb-3">📝</div>
						<h3 className="text-xl font-semibold mb-2">Chưa có lần nộp bài nào</h3>
						<p className="text-gray-600 mb-4">Bạn chưa nộp bài tập này</p>
						<button
							onClick={() => navigate(`/student/sections/${sectionId}/assignments/${assignmentId}`)}
							className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
						>
							Làm bài ngay
						</button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						{/* Sidebar: List of submissions */}
						<aside className="md:col-span-1">
							<div className="bg-white border rounded-lg p-4 sticky top-24">
								<h3 className="text-lg font-semibold mb-4">Các lần nộp bài ({submissions.length})</h3>
								<div className="space-y-2">
									{submissions.map((submission, index) => (
										<button
											key={submission.id}
											onClick={() => fetchSubmissionDetails(submission.id)}
											className={`w-full text-left p-3 rounded border transition-colors ${selectedSubmission?.id === submission.id
												? "bg-indigo-50 border-indigo-300"
												: "bg-white hover:bg-gray-50"
												}`}
										>
											<div className="flex items-center justify-between mb-1">
												<span className="text-sm font-medium">Lần {submissions.length - index}</span>
												{submission.score !== null && (
													<span className={`text-sm font-bold ${getScoreColor(submission.score, submission.maxScore)}`}>
														{submission.score}/{submission.maxScore}
													</span>
												)}
											</div>
											<div className="text-xs text-gray-600">
												{dayjs(submission.submittedAt).format("DD/MM/YYYY HH:mm")}
											</div>
											<div className="text-xs text-gray-500 mt-1">
												{dayjs(submission.submittedAt).fromNow()}
											</div>
										</button>
									))}
								</div>
							</div>
						</aside>

						{/* Main content: Submission details */}
						<main className="md:col-span-3">
							{selectedSubmission ? (
								<div className="space-y-6">
									{/* Submission Summary */}
									<div className={`border rounded-lg p-6 ${getScoreBgColor(selectedSubmission.score || 0, selectedSubmission.maxScore)}`}>
										<div className="flex items-start justify-between mb-4">
											<div>
												<h2 className="text-2xl font-bold mb-2">
													Kết quả bài làm
												</h2>
												<div className="flex items-center gap-4 text-sm text-gray-600">
													<span>Nộp lúc: {dayjs(selectedSubmission.submittedAt).format("DD/MM/YYYY HH:mm")}</span>
													{selectedSubmission.gradedAt && (
														<span>Chấm lúc: {dayjs(selectedSubmission.gradedAt).format("DD/MM/YYYY HH:mm")}</span>
													)}
												</div>
											</div>

											<div className="text-right">
												<div className={`text-4xl font-bold ${getScoreColor(selectedSubmission.score || 0, selectedSubmission.maxScore)}`}>
													{selectedSubmission.score || 0} / {selectedSubmission.maxScore}
												</div>
												<div className="text-sm text-gray-600 mt-1">
													{selectedSubmission.score !== null
														? `${Math.round((selectedSubmission.score / selectedSubmission.maxScore) * 100)}%`
														: "Chưa chấm"}
												</div>
											</div>
										</div>

										{selectedSubmission.feedback && (
											<div className="mt-4 p-4 bg-white rounded border">
												<p className="text-sm font-medium text-gray-700 mb-2">Nhận xét chung:</p>
												<p className="text-sm text-gray-900">{selectedSubmission.feedback}</p>
											</div>
										)}

										<div className="mt-4 grid grid-cols-2 gap-4 text-sm">
											<div className="bg-white p-3 rounded border">
												<span className="text-gray-600">Thời gian làm bài:</span>
												<div className="font-medium text-gray-900 mt-1">
													{dayjs(selectedSubmission.completedAt).diff(dayjs(selectedSubmission.startedAt), "minute")} phút
												</div>
											</div>
											<div className="bg-white p-3 rounded border">
												<span className="text-gray-600">Trạng thái:</span>
												<div className="font-medium text-gray-900 mt-1">
													{selectedSubmission.autoGraded ? "Tự động chấm" : "Chấm thủ công"}
												</div>
											</div>
										</div>
									</div>

									{/* Answers */}
									<div>
										<h3 className="text-xl font-bold mb-4">Chi tiết từng câu</h3>
										<div className="space-y-4">
											{selectedSubmission.answers?.map((answer, index) =>
												renderAnswerResult(answer, index)
											)}
										</div>
									</div>
								</div>
							) : (
								<div className="bg-white border rounded-lg p-8 text-center">
									<div className="text-3xl mb-3">📋</div>
									<p className="text-gray-600">Chọn một lần nộp bài để xem chi tiết</p>
								</div>
							)}
						</main>
					</div>
				)}
			</div>
		</div>
	);
}