import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Link } from "react-router-dom";

dayjs.locale("vi");

type QuestionType = "multiple_choice" | "essay" | "coding" | "true_false";
type AssignmentType = "exercise" | "quiz" | "project" | "exam";

interface QuestionChoice {
	id: number;
	questionId: number;
	content: string;
	isCorrect: boolean;
	order: number;
}

interface TestCase {
	id: number;
	questionId: number;
	input: string;
	expectedOutput: string;
	isHidden: boolean;
	points: number;
	order: number;
}

interface TestResult {
	id: number;
	got: string;
	input: string;
	expect: string;
	status: "ok" | "wrong" | "error";
}

interface Question {
	id: number;
	type: QuestionType;
	content: string;
	explanation: string | null;
	points: number;
	order: number;
	choices: QuestionChoice[];
	testCases?: TestCase[];
}

interface Assignment {
	id: number;
	title: string;
	description: string | null;
	type: AssignmentType;
	dueDate: string | null;
	maxScore: number;
	timeLimit: number | null;
	maxAttempts: number;
	shuffleQuestions: boolean;
	showAnswersAfterSubmit: boolean;
	allowLateSubmission: boolean;
	questions: Question[];
}

interface Answer {
	questionId: number;
	selectedChoices?: number[];
	essayAnswer?: string;
	codeAnswer?: string;
	language?: string;
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

export default function AssignmentsDetailsStudent() {
	const { assignmentId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [assignment, setAssignment] = useState<Assignment | null>(null);
	const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]); // 🔥 Questions sau khi shuffle
	const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
	const [codeResults, setCodeResults] = useState<Map<number, CodeSubmissionResult>>(
		new Map()
	);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [testingCode, setTestingCode] = useState<Set<number>>(new Set());
	const [error, setError] = useState("");
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [hasStarted, setHasStarted] = useState(false);
	const [isLateSubmission, setIsLateSubmission] = useState(false); // 🔥 Trạng thái nộp muộn

	const studentId = user?.student?.id;
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	useEffect(() => {
		if (assignmentId) {
			fetchAssignmentDetails();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assignmentId]);

	useEffect(() => {
		if (hasStarted && timeRemaining !== null && timeRemaining > 0) {
			const timer = setInterval(() => {
				setTimeRemaining((prev) => {
					if (prev === null || prev <= 0) {
						clearInterval(timer);
						handleAutoSubmit();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [hasStarted, timeRemaining]);

	const fetchAssignmentDetails = async () => {
		setLoading(true);
		try {
			const assignmentRes = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}`,
				{ credentials: "include" }
			);
			const assignmentData = await assignmentRes.json();

			if (!assignmentData.success) {
				setError("Không thể tải thông tin bài tập");
				setLoading(false);
				return;
			}

			const questionsRes = await fetch(
				`http://localhost:4000/api/v1/questions`,
				{ credentials: "include" }
			);
			const questionsData = await questionsRes.json();

			if (!questionsData.success) {
				setError("Không thể tải danh sách câu hỏi");
				setLoading(false);
				return;
			}

			const assignmentQuestions = assignmentData.data.questions || [];
			const allQuestions = questionsData.data || [];

			const questionIds = assignmentQuestions.map((q: any) => q.questionId);
			const questionsMap = new Map(allQuestions.map((q: Question) => [q.id, q]));

			const fullQuestions: Question[] = questionIds
				.map((id: number) => questionsMap.get(id))
				.filter((q: any): q is Question => q !== undefined)
				.sort((a: any, b: any) => a.order - b.order);

			for (const question of fullQuestions) {
				if (question.type === "coding") {
					try {
						const testCasesRes = await fetch(
							`http://localhost:4000/api/v1/test-cases/question/${question.id}`,
							{ credentials: "include" }
						);
						const testCasesData = await testCasesRes.json();

						if (testCasesData.success) {
							question.testCases = testCasesData.data || [];
						}
					} catch (err) {
						console.error(
							`Error fetching test cases for question ${question.id}:`,
							err
						);
					}
				}
			}

			const assignmentObj = {
				...assignmentData.data,
				questions: fullQuestions,
			};

			setAssignment(assignmentObj);

			// 🔥 Kiểm tra nộp muộn
			if (assignmentObj.dueDate) {
				const now = dayjs();
				const dueDate = dayjs(assignmentObj.dueDate);
				if (now.isAfter(dueDate)) {
					setIsLateSubmission(true);
				}
			}

		} catch (err) {
			console.error("Fetch error:", err);
			setError("Lỗi kết nối server");
		} finally {
			setLoading(false);
		}
	};

	// 🔥 Hàm shuffle questions
	const shuffleArray = <T,>(array: T[]): T[] => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	const handleStartAssignment = async () => {
		// 🔥 Kiểm tra allowLateSubmission
		if (isLateSubmission && !assignment?.allowLateSubmission) {
			alert("⚠️ Bài tập đã hết hạn nộp và không cho phép nộp muộn!");
			return;
		}

		try {
			const res = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}/start`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						studentId: studentId,
					}),
				}
			);

			const data = await res.json();

			if (data.success) {
				setHasStarted(true);
				if (assignment?.timeLimit) {
					setTimeRemaining(assignment.timeLimit * 60);
				}

				// 🔥 Shuffle questions nếu cần
				if (assignment?.shuffleQuestions) {
					const shuffled = shuffleArray(assignment.questions);
					setDisplayQuestions(shuffled);
				} else {
					setDisplayQuestions(assignment?.questions || []);
				}
			} else {
				setError(data.message || "Không thể bắt đầu bài tập");
			}
		} catch (err) {
			console.error("Error starting assignment:", err);
			setError("Lỗi khi bắt đầu bài tập");
		}
	};

	const handleAnswerChange = (questionId: number, answer: Partial<Answer>) => {
		setAnswers((prev) => {
			const newAnswers = new Map(prev);
			const existingAnswer = newAnswers.get(questionId) || { questionId };
			newAnswers.set(questionId, { ...existingAnswer, ...answer });
			return newAnswers;
		});
	};

	const handleMultipleChoiceChange = (
		questionId: number,
		choiceId: number,
		isMultiple: boolean
	) => {
		const currentAnswer = answers.get(questionId);
		let selectedChoices: number[] = currentAnswer?.selectedChoices || [];

		if (isMultiple) {
			if (selectedChoices.includes(choiceId)) {
				selectedChoices = selectedChoices.filter((id) => id !== choiceId);
			} else {
				selectedChoices = [...selectedChoices, choiceId];
			}
		} else {
			selectedChoices = [choiceId];
		}

		handleAnswerChange(questionId, { selectedChoices });
	};

	const handleTestCode = async (questionId: number) => {
		const answer = answers.get(questionId);

		if (!answer?.codeAnswer || !answer?.language) {
			alert("Vui lòng nhập code và chọn ngôn ngữ!");
			return;
		}

		setTestingCode((prev) => new Set(prev).add(questionId));

		try {
			const res = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}/submit-code`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						studentId: studentId,
						questionId: questionId,
						language: answer.language,
						codeAnswer: answer.codeAnswer,
					}),
				}
			);

			const data = await res.json();

			console.log(data);

			if (data.success) {
				setCodeResults((prev) => {
					const newResults = new Map(prev);
					newResults.set(questionId, data.data);
					return newResults;
				});
				alert(
					`✅ Test thành công! Điểm: ${data.data.score}/${data.data.maxScore}`
				);
			} else {
				alert(`❌ Test thất bại: ${data.message}`);
			}
		} catch (err) {
			console.error("Error testing code:", err);
			alert("Lỗi khi test code");
		} finally {
			setTestingCode((prev) => {
				const newSet = new Set(prev);
				newSet.delete(questionId);
				return newSet;
			});
		}
	};

	const handleSubmit = async () => {
		// 🔥 Kiểm tra nộp muộn
		if (isLateSubmission && !assignment?.allowLateSubmission) {
			alert("⚠️ Bài tập đã hết hạn nộp và không cho phép nộp muộn!");
			return;
		}

		const unansweredQuestions = assignment?.questions.filter((q) => !answers.has(q.id));

		if (unansweredQuestions && unansweredQuestions.length > 0) {
			const confirm = window.confirm(
				`Bạn còn ${unansweredQuestions.length} câu chưa trả lời.\nBạn có chắc muốn nộp bài?`
			);
			if (!confirm) return;
		}

		setSubmitting(true);
		try {
			const answersArray = Array.from(answers.values());

			const payload = {
				studentId,
				answers: answersArray,
			};

			const res = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}/submit`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(payload),
				}
			);

			let data: any;
			try {
				data = await res.json();
			} catch {
				throw new Error("Không đọc được phản hồi từ server");
			}

			if (!res.ok) {
				throw new Error(data?.message || `Lỗi HTTP ${res.status}`);
			}

			if (data.success) {
				alert("✅ Nộp bài thành công!");
				console.log(data.data);
				navigate(
					`/student/courses/${sectionId}/assignments/${assignmentId}/score`,
					{
						state: {
							...data.data,
							showAnswersAfterSubmit: assignment?.showAnswersAfterSubmit // 🔥 Truyền setting
						}
					}
				);
			} else {
				throw new Error(data?.message || "Nộp bài thất bại");
			}
		} catch (err: any) {
			console.error("Error submitting:", err);
			const msg = err?.message || "Lỗi khi nộp bài";
			setError(msg);
			alert(`❌ ${msg}`);
		} finally {
			setSubmitting(false);
		}
	};

	const handleAutoSubmit = async () => {
		alert("⏰ Hết thời gian! Bài tập sẽ được nộp tự động.");
		await handleSubmit();
	};

	const handleBack = () => {
		if (hasStarted) {
			const confirm = window.confirm(
				"Bạn có chắc muốn thoát? Tiến trình làm bài sẽ không được lưu."
			);
			if (!confirm) return;
		}
		navigate(`/student/courses/${sectionId}/assignments`);
	};

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
				.toString()
				.padStart(2, "0")}`;
		}
		return `${minutes}:${secs.toString().padStart(2, "0")}`;
	};

	const getAnsweredCount = () => {
		return answers.size;
	};

	const renderTestResults = (questionId: number) => {
		const result = codeResults.get(questionId);

		if (!result) return null;

		return (
			<div className="mt-4 p-4 bg-gray-50 rounded-lg border">
				<div className="flex items-center justify-between mb-3">
					<h4 className="font-medium text-gray-900">Kết quả Test</h4>
					<div className="flex items-center gap-2">
						<span
							className={`text-lg font-bold ${result.score === result.maxScore
								? "text-green-600"
								: "text-orange-600"
								}`}
						>
							{result.score} / {result.maxScore} điểm
						</span>
						<span
							className={`text-xs px-2 py-1 rounded ${result.judgeStatus === "accepted"
								? "bg-green-100 text-green-700"
								: result.judgeStatus === "queued"
									? "bg-yellow-100 text-yellow-700"
									: "bg-red-100 text-red-700"
								}`}
						>
							{result.judgeStatus}
						</span>
					</div>
				</div>

				{result.compileLog && (
					<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
						<p className="text-xs font-medium text-red-700 mb-1">
							Compile Error:
						</p>
						<pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
							{result.compileLog}
						</pre>
					</div>
				)}

				{result.stderrLog && (
					<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
						<p className="text-xs font-medium text-red-700 mb-1">
							Runtime Error:
						</p>
						<pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
							{result.stderrLog}
						</pre>
					</div>
				)}

				{result.testResults && result.testResults.length > 0 && (
					<div className="space-y-2">
						<p className="text-sm font-medium text-gray-700">Test Cases:</p>
						{result.testResults.map((test, index) => (
							<div
								key={test.id}
								className={`p-3 rounded border ${test.status === "ok"
									? "bg-green-50 border-green-200"
									: "bg-red-50 border-red-200"
									}`}
							>
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">
										Test Case {index + 1}
									</span>
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

				{result.stdoutLog && (
					<div className="mt-3 p-3 bg-gray-100 rounded">
						<p className="text-xs font-medium text-gray-700 mb-1">Output:</p>
						<pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
							{result.stdoutLog}
						</pre>
					</div>
				)}
			</div>
		);
	};

	const renderQuestion = (question: Question, index: number) => {
		const answer = answers.get(question.id);
		const isTesting = testingCode.has(question.id);

		return (
			<div key={question.id} className="bg-white rounded-lg border p-6 mb-4 shadow-sm">
				{/* Question Header */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<span className="bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded">
								Câu {index + 1}
							</span>
							<span className="text-sm text-gray-600">({question.points} điểm)</span>
							{question.type === "coding" && (
								<span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
									💻 Code
								</span>
							)}
						</div>
						<p className="text-gray-900 whitespace-pre-wrap">{question.content}</p>
					</div>
				</div>

				{/* Question Body */}
				<div className="mt-4">
					{question.type === "multiple_choice" && question.choices && (
						<div className="space-y-2">
							{question.choices
								.sort((a, b) => a.order - b.order)
								.map((choice) => {
									const isSelected =
										answer?.selectedChoices?.includes(choice.id) || false;
									const hasMultipleCorrect =
										question.choices!.filter((c) => c.isCorrect).length > 1;

									return (
										<label
											key={choice.id}
											className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${isSelected
												? "bg-indigo-50 border-indigo-200"
												: "hover:bg-gray-50"
												}`}
										>
											<input
												type={hasMultipleCorrect ? "checkbox" : "radio"}
												name={`question-${question.id}`}
												checked={isSelected}
												onChange={() =>
													handleMultipleChoiceChange(
														question.id,
														choice.id,
														hasMultipleCorrect
													)
												}
												className="mt-1"
												disabled={!hasStarted}
											/>
											<span className="flex-1 text-gray-900">{choice.content}</span>
										</label>
									);
								})}
							{question.choices.filter((c) => c.isCorrect).length > 1 && (
								<p className="text-xs text-gray-600 mt-2">
									* Câu hỏi có nhiều đáp án đúng
								</p>
							)}
						</div>
					)}

					{question.type === "true_false" && (
						<div className="space-y-2">
							{[
								{ id: 1, content: "Đúng", value: true },
								{ id: 2, content: "Sai", value: false },
							].map((option) => {
								const isSelected =
									answer?.selectedChoices?.includes(option.id) || false;

								return (
									<label
										key={option.id}
										className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${isSelected
											? "bg-indigo-50 border-indigo-200"
											: "hover:bg-gray-50"
											}`}
									>
										<input
											type="radio"
											name={`question-${question.id}`}
											checked={isSelected}
											onChange={() =>
												handleAnswerChange(question.id, {
													selectedChoices: [option.id],
												})
											}
											className="mt-1"
											disabled={!hasStarted}
										/>
										<span className="flex-1 text-gray-900">{option.content}</span>
									</label>
								);
							})}
						</div>
					)}

					{question.type === "essay" && (
						<div>
							<textarea
								value={answer?.essayAnswer || ""}
								onChange={(e) =>
									handleAnswerChange(question.id, {
										essayAnswer: e.target.value,
									})
								}
								placeholder="Nhập câu trả lời của bạn..."
								className="w-full min-h-[150px] p-3 border rounded focus:outline-none focus:border-indigo-500"
								disabled={!hasStarted}
							/>
							<p className="text-xs text-gray-600 mt-2">
								{answer?.essayAnswer?.length || 0} ký tự
							</p>
						</div>
					)}

					{question.type === "coding" && (
						<div>
							<div className="mb-3 flex items-center justify-between">
								<div className="flex items-center gap-2">
									<label className="text-sm font-medium text-gray-700">Ngôn ngữ:</label>
									<select
										value={answer?.language || "javascript"}
										onChange={(e) =>
											handleAnswerChange(question.id, {
												language: e.target.value,
											})
										}
										className="px-3 py-1.5 border rounded text-sm focus:outline-none focus:border-indigo-500"
										disabled={!hasStarted}
									>
										<option value="javascript">JavaScript</option>
										<option value="python">Python</option>
										<option value="java">Java</option>
										<option value="cpp">C++</option>
										<option value="html">HTML</option>
										<option value="csharp">C#</option>
										<option value="php">PHP</option>
									</select>
								</div>
								<button
									onClick={() => handleTestCode(question.id)}
									disabled={!hasStarted || isTesting || !answer?.codeAnswer}
									className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
								>
									{isTesting ? "Đang test..." : "🧪 Test Code"}
								</button>
							</div>

							<textarea
								value={answer?.codeAnswer || ""}
								onChange={(e) =>
									handleAnswerChange(question.id, {
										codeAnswer: e.target.value,
									})
								}
								placeholder="// Nhập code của bạn..."
								className="w-full min-h-[260px] p-3 border rounded font-mono text-sm focus:outline-none focus:border-indigo-500 bg-gray-900 text-green-400"
								disabled={!hasStarted}
								spellCheck={false}
							/>

							{question.testCases && question.testCases.length > 0 && (
								<div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded">
									<p className="text-sm font-medium text-indigo-900 mb-2">
										📋 Thông tin Test Cases:
									</p>
									<ul className="text-sm text-indigo-800 space-y-1">
										<li>
											• Tổng số test cases:{" "}
											<span className="font-medium">{question.testCases.length}</span>
										</li>
										<li>
											• Công khai:{" "}
											<span className="font-medium">
												{question.testCases.filter((tc) => !tc.isHidden).length}
											</span>
										</li>
										<li>
											• Ẩn:{" "}
											<span className="font-medium">
												{question.testCases.filter((tc) => tc.isHidden).length}
											</span>
										</li>
									</ul>
								</div>
							)}

							{renderTestResults(question.id)}
						</div>
					)}
				</div>
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

	if (!assignment) {
		return (
			<div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">Không tìm thấy bài tập</p>
					<button onClick={handleBack} className="text-indigo-600 hover:underline">
						Quay lại
					</button>
				</div>
			</div>
		);
	}

	if (!assignment.questions || assignment.questions.length === 0) {
		return (
			<div className="w-full min-h-screen bg-gray-50">
				<div className="bg-white border-b">
					<div className="px-4 py-4">
						<button onClick={handleBack} className="text-sm text-indigo-600 hover:underline mb-2">
							← Quay lại
						</button>
						<h1 className="text-xl font-medium text-gray-900">{assignment.title}</h1>
					</div>
				</div>
				<div className="px-4 py-8">
					<div className="max-w-2xl mx-auto bg-white rounded-lg border p-8 text-center">
						<p className="text-gray-600">Bài tập này chưa có câu hỏi nào</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full min-h-screen bg-gray-50 pb-28">
			{/* 🔥 Cảnh báo nộp muộn */}
			{isLateSubmission && assignment.allowLateSubmission && (
				<div className="bg-red-600 text-white px-4 py-3 text-center font-medium">
					⚠️ CẢNH BÁO: Bạn đang nộp muộn! Hạn nộp đã qua vào {dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
				</div>
			)}

			{/* Top Bar */}
			<div className="bg-white border-b sticky top-0 z-20 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<button onClick={handleBack} className="text-indigo-600 hover:underline text-sm">
							← Quay lại
						</button>
						<div>
							<h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
							{assignment.description && (
								<p className="text-sm text-gray-600">{assignment.description}</p>
							)}
						</div>
					</div>

					{/* Header Right: timer & progress */}
					<div className="flex items-center gap-4">
						{hasStarted && timeRemaining !== null && (
							<div className={`text-right ${timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-gray-900"}`}>
								<div className="text-lg font-bold font-mono">{formatTime(timeRemaining)}</div>
								<div className="text-xs">Thời gian còn lại</div>
							</div>
						)}

						<div className="text-sm text-gray-600">
							Đã trả lời:{" "}
							<span className={getAnsweredCount() === assignment.questions.length ? "text-green-600 font-medium" : "text-indigo-600 font-medium"}>
								{getAnsweredCount()} / {assignment.questions.length}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Two-column layout */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* Left column: Assignment info */}
					<aside className="md:col-span-1">
						<div className="sticky top-20 space-y-4">
							<div className="bg-white border rounded-lg p-5 shadow-sm">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin bài tập</h3>
								<p className="text-sm text-gray-600 mb-3">{assignment.description}</p>

								<div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
									<div className="flex flex-col">
										<span className="text-xs text-gray-500">Loại</span>
										<span className="font-medium">{assignment.type}</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-500">Tổng câu</span>
										<span className="font-medium">{assignment.questions.length}</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-500">Tổng điểm</span>
										<span className="font-medium">{assignment.maxScore}</span>
									</div>
									<div className="flex flex-col">
										<span className="text-xs text-gray-500">Thời gian</span>
										<span className="font-medium">{assignment.timeLimit ? `${assignment.timeLimit} phút` : "Không giới hạn"}</span>
									</div>
									{assignment.dueDate && (
										<div className="col-span-2">
											<span className="text-xs text-gray-500">Hạn nộp</span>
											<div className={`font-medium text-sm ${isLateSubmission ? "text-red-600" : ""}`}>
												{dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
												{isLateSubmission && " (Đã hết hạn)"}
											</div>
										</div>
									)}
								</div>

								{/* Progress Bar */}
								<div className="mt-4">
									<div className="text-xs text-gray-500 mb-1">Tiến độ làm bài</div>
									<div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
										<div
											className="h-3 bg-indigo-600"
											style={{
												width: `${Math.round((getAnsweredCount() / assignment.questions.length) * 100)}%`,
											}}
										/>
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{Math.round((getAnsweredCount() / assignment.questions.length) * 100)}%
									</div>
								</div>

								<div className="mt-4 flex flex-col gap-2">
									{!hasStarted ? (
										<>
											<button
												onClick={handleStartAssignment}
												className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
											>
												Bắt đầu làm bài
											</button>
											<Link
												to={`/student/courses/${sectionId}/assignments/${assignmentId}/history`}
												className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-md font-medium text-center"
											>
												📜 Xem lịch sử nộp bài
											</Link>
										</>
									) : (
										<button
											disabled
											className="w-full px-4 py-2 bg-gray-200 text-gray-600 rounded-md font-medium"
										>
											Đang làm bài
										</button>
									)}

									<button
										onClick={() => navigator.clipboard.writeText(window.location.href)}
										className="w-full px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
									>
										Sao chép liên kết bài tập
									</button>
								</div>
							</div>

							{/* Tips / Rules */}
							<div className="bg-white border rounded-lg p-4 text-sm text-gray-700 shadow-sm">
								<h4 className="font-medium mb-2">Lưu ý</h4>
								<ul className="list-disc pl-5 space-y-1">
									<li>Nhớ kiểm tra kỹ trước khi nộp.</li>
									<li>Nộp bài sẽ kết thúc phiên làm (nếu có thời gian).</li>
									<li>Nếu có mã lỗi khi test, kiểm tra chi tiết trong phần kết quả.</li>
									{assignment.shuffleQuestions && (
										<li className="text-blue-600">🔀 Thứ tự câu hỏi đã được xáo trộn</li>
									)}
								</ul>
							</div>
						</div>
					</aside>

					{/* Right column: Questions */}
					<main className="md:col-span-2">
						{error && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
								⚠️ {error}
							</div>
						)}

						{/* Questions list */}
						<div className="space-y-4">
							{hasStarted ? (
								displayQuestions.map((question, index) => renderQuestion(question, index))
							) : (
								<div className="bg-white border rounded-lg p-8 text-center shadow">
									<div className="text-3xl mb-3">📝</div>
									<h3 className="text-xl font-semibold mb-2">Sẵn sàng làm bài?</h3>
									<p className="text-gray-600 mb-4">
										Nhấn nút bên trái để bắt đầu. {assignment.timeLimit ? `Bạn sẽ có ${assignment.timeLimit} phút.` : ""}
									</p>
									<button
										onClick={handleStartAssignment}
										className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
									>
										Bắt đầu làm bài
									</button>
								</div>
							)}
						</div>
					</main>
				</div>
			</div>

			{/* Fixed submit bar on bottom right when started */}
			{hasStarted && (
				<div className="fixed bottom-4 right-4 z-30">
					<div className="flex items-center gap-3">
						<div className="bg-white border rounded-lg p-3 shadow flex items-center gap-3">
							<div className="text-sm text-gray-600">Đã trả lời</div>
							<div className="text-lg font-bold text-indigo-600">
								{getAnsweredCount()} / {assignment.questions.length}
							</div>
						</div>
						<button
							onClick={handleSubmit}
							disabled={submitting}
							className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-lg disabled:bg-gray-400"
						>
							{submitting ? "Đang nộp..." : "✅ Nộp bài"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}