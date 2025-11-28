import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { Link } from "react-router-dom";
import {
	Clock,
	Power,
	Send,
	History,
	AlertTriangle,
	FileText,
} from "lucide-react";

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
	const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
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
	const [isLateSubmission, setIsLateSubmission] = useState(false);

	// 🔥 Sử dụng useRef để tránh stale closure
	const answersRef = useRef(answers);
	const submittingRef = useRef(submitting);

	const studentId = user?.student?.id;
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	// 🔥 Cập nhật ref mỗi khi answers thay đổi
	useEffect(() => {
		answersRef.current = answers;
	}, [answers]);

	useEffect(() => {
		submittingRef.current = submitting;
	}, [submitting]);

	useEffect(() => {
		if (assignmentId) {
			fetchAssignmentDetails();
		}
	}, [assignmentId]);

	// 🔥 TIMER EFFECT - Đã sửa lại hoàn toàn
	useEffect(() => {
		if (!hasStarted || timeRemaining === null || timeRemaining <= 0) {
			return;
		}

		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(timer);
					// 🔥 Gọi submit với delay nhỏ để đảm bảo state đã update
					setTimeout(() => {
						if (!submittingRef.current) {
							handleAutoSubmit();
						}
					}, 100);
					return 0;
				}

				// 🔥 Cảnh báo khi còn 5 phút
				if (prev === 300) {
					alert("⚠️ CHÚ Ý: Còn 5 phút! Hãy kiểm tra và chuẩn bị nộp bài.");
				}

				// 🔥 Cảnh báo khi còn 1 phút
				if (prev === 60) {
					alert("🚨 KHẨN CẤP: Còn 1 phút! Bài sẽ được nộp tự động khi hết giờ.");
				}

				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
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

	const shuffleArray = <T,>(array: T[]): T[] => {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	const handleStartAssignment = async () => {
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
			console.log("📤 Submitting code...");

			const submitRes = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}/submit-code`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({
						studentId: studentId,
						questionId: questionId,
						language: answer.language,
						codeAnswer: answer.codeAnswer,
					}),
				}
			);

			const submitData = await submitRes.json();

			if (!submitData.success) {
				alert(`❌ Lỗi: ${submitData.message}`);
				return;
			}

			const answerId = submitData.data.answer?.id || submitData.data.id;

			if (!answerId) {
				console.error("❌ No answerId in response:", submitData);
				alert("❌ Không nhận được ID câu trả lời");
				return;
			}

			console.log("✅ Answer ID:", answerId);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			let attempts = 0;
			const maxAttempts = 60;
			const pollInterval = 500;

			const pollResult = async (): Promise<any> => {
				attempts++;

				if (attempts > maxAttempts) {
					throw new Error("⏰ Timeout: Quá thời gian chờ kết quả (30 giây)");
				}

				const resultRes = await fetch(
					`http://localhost:4000/api/v1/assignments/answer/${answerId}/status`,
					{ credentials: "include" }
				);

				const resultData = await resultRes.json();

				if (!resultData.success) {
					throw new Error(resultData.message || "Không lấy được kết quả");
				}

				const status = resultData.data.judgeStatus;

				if (status === "queued" || status === "judging") {
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
					return pollResult();
				}

				if (status === "error") {
					throw new Error(
						resultData.data.stderrLog ||
						resultData.data.compileLog ||
						"Lỗi khi chạy code"
					);
				}

				return resultData.data;
			};

			const result = await pollResult();

			setCodeResults((prev) => {
				const newResults = new Map(prev);
				newResults.set(questionId, result);
				return newResults;
			});

			const score = result.score ?? 0;
			const maxScore = result.maxScore ?? 0;
			const testResults = result.testResults || [];
			const passedCount = testResults.filter((t: any) => t.status === "ok" || t.isPassed).length;

			alert(
				`✅ Test hoàn tất!\n\n` +
				`📊 Điểm: ${score}/${maxScore}\n` +
				`✓ Test cases passed: ${passedCount}/${testResults.length}\n` +
				`${score === maxScore ? "🎉 Perfect!" : "💪 Cố gắng thêm!"}`
			);

		} catch (err: any) {
			console.error("❌ Error testing code:", err);
			alert(`❌ ${err.message || "Lỗi khi test code"}`);
		} finally {
			setTestingCode((prev) => {
				const newSet = new Set(prev);
				newSet.delete(questionId);
				return newSet;
			});
		}
	};

	const handleSubmit = async (isAutoSubmit: boolean = false) => {
		// 🔥 Ngăn submit trùng lặp
		if (submitting) {
			console.log("⚠️ Đang submit, bỏ qua request mới");
			return;
		}

		if (!isAutoSubmit && isLateSubmission && !assignment?.allowLateSubmission) {
			alert("⚠️ Bài tập đã hết hạn nộp và không cho phép nộp muộn!");
			return;
		}

		// 🔥 Sử dụng ref để lấy answers mới nhất
		const currentAnswers = answersRef.current;
		const answersArray = Array.from(currentAnswers.values());

		if (!isAutoSubmit) {
			const unansweredQuestions = displayQuestions.filter((q) => !currentAnswers.has(q.id));

			if (unansweredQuestions.length > 0) {
				const confirm = window.confirm(
					`Bạn còn ${unansweredQuestions.length} câu chưa trả lời.\nBạn có chắc muốn nộp bài?`
				);
				if (!confirm) return;
			}
		}

		setSubmitting(true);

		try {
			console.log(`🔥 ${isAutoSubmit ? 'Auto-' : ''}Submitting với ${answersArray.length} câu trả lời`);

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
				const message = isAutoSubmit
					? `✅ Đã tự động nộp bài do hết thời gian!\n\nSố câu đã làm: ${answersArray.length}/${displayQuestions.length}`
					: "✅ Nộp bài thành công!";

				if (assignment?.showAnswersAfterSubmit) {
					alert(message + "\n\nBạn sẽ xem kết quả chi tiết.");
					navigate(
						`/student/courses/${sectionId}/assignments/${assignmentId}/score`,
						{
							state: {
								...data.data,
								showAnswersAfterSubmit: true,
							},
						}
					);
				} else {
					alert(message);
					navigate(`/student/courses/${sectionId}/assignments`);
				}
			} else {
				throw new Error(data?.message || "Nộp bài thất bại");
			}
		} catch (err: any) {
			console.error("Error submitting:", err);
			const msg = err?.message || "Lỗi khi nộp bài";
			setError(msg);
			alert(`❌ ${msg}`);

			// 🔥 Nếu auto-submit lỗi vẫn redirect về danh sách
			if (isAutoSubmit) {
				setTimeout(() => {
					navigate(`/student/courses/${sectionId}/assignments`);
				}, 2000);
			}
		} finally {
			setSubmitting(false);
		}
	};

	// 🔥 Hàm auto-submit - chỉ gọi handleSubmit với flag
	const handleAutoSubmit = () => {
		console.log("⏰ HẾT GIỜ! Tự động nộp bài...");
		handleSubmit(true);
	};

	const handleExit = () => {
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

		return `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getAnsweredCount = () => {
		return answers.size;
	};

	const scrollToQuestion = (index: number) => {
		const element = document.getElementById(`question-${index}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	};

	const renderTestResults = (questionId: number) => {
		const result = codeResults.get(questionId);
		if (!result) return null;

		return (
			<div className="mt-4 p-4 bg-gray-50 rounded border">
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
					</div>
				</div>

				{result.testResults && result.testResults.length > 0 && (
					<div className="space-y-2">
						{result.testResults.map((test, index) => (
							<div
								key={test.id}
								className={`p-3 rounded text-sm ${test.status === "ok"
									? "bg-green-50 border border-green-200"
									: "bg-red-50 border border-red-200"
									}`}
							>
								<div className="flex justify-between items-center">
									<span className="font-medium">Test {index + 1}</span>
									<span
										className={
											test.status === "ok" ? "text-green-600" : "text-red-600"
										}
									>
										{test.status === "ok" ? "✓ Passed" : "✗ Failed"}
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	const renderQuestion = (question: Question, index: number) => {
		const answer = answers.get(question.id);
		const isTesting = testingCode.has(question.id);
		const isAnswered = answers.has(question.id);

		return (
			<div
				key={question.id}
				id={`question-${index}`}
				className="bg-white rounded-lg border shadow-sm p-6 scroll-mt-24"
			>
				<div className="mb-4">
					<h3 className="text-lg font-bold text-gray-900 mb-3">
						{index + 1}. {question.content}
					</h3>
				</div>

				<div>
					{question.type === "multiple_choice" && question.choices && (
						<div className="space-y-3">
							{question.choices
								.sort((a, b) => a.order - b.order)
								.map((choice, idx) => {
									const label = String.fromCharCode(65 + idx);
									const isSelected =
										answer?.selectedChoices?.includes(choice.id) || false;
									const hasMultipleCorrect =
										question.choices!.filter((c) => c.isCorrect).length > 1;

									return (
										<label
											key={choice.id}
											className="flex items-start gap-3 cursor-pointer group"
										>
											<div className="flex-shrink-0 mt-0.5">
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
													disabled={!hasStarted}
													className="hidden"
												/>
												<div
													className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
														? "bg-blue-600 border-blue-600"
														: "border-gray-300 group-hover:border-blue-400"
														}`}
												>
													{isSelected && (
														<span className="text-white text-sm font-bold">
															✓
														</span>
													)}
												</div>
											</div>
											<div className="flex-1">
												<span className="font-bold text-gray-900 mr-2">
													{label}.
												</span>
												<span className="text-gray-700">{choice.content}</span>
											</div>
										</label>
									);
								})}
						</div>
					)}

					{question.type === "true_false" && (
						<div className="space-y-3">
							{[
								{ id: 1, content: "Đúng", value: true },
								{ id: 2, content: "Sai", value: false },
							].map((option, idx) => {
								const label = String.fromCharCode(65 + idx);
								const isSelected =
									answer?.selectedChoices?.includes(option.id) || false;

								return (
									<label
										key={option.id}
										className="flex items-start gap-3 cursor-pointer group"
									>
										<div className="flex-shrink-0 mt-0.5">
											<input
												type="radio"
												name={`question-${question.id}`}
												checked={isSelected}
												onChange={() =>
													handleAnswerChange(question.id, {
														selectedChoices: [option.id],
													})
												}
												disabled={!hasStarted}
												className="hidden"
											/>
											<div
												className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
													? "bg-blue-600 border-blue-600"
													: "border-gray-300 group-hover:border-blue-400"
													}`}
											>
												{isSelected && (
													<span className="text-white text-sm font-bold">
														✓
													</span>
												)}
											</div>
										</div>
										<div className="flex-1">
											<span className="font-bold text-gray-900 mr-2">
												{label}.
											</span>
											<span className="text-gray-700">{option.content}</span>
										</div>
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
								className="w-full min-h-[200px] p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
								disabled={!hasStarted}
							/>
							<p className="text-xs text-gray-500 mt-2">
								{answer?.essayAnswer?.length || 0} ký tự
							</p>
						</div>
					)}

					{question.type === "coding" && (
						<div>
							<div className="mb-3 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
								<select
									value={answer?.language || "javascript"}
									onChange={(e) =>
										handleAnswerChange(question.id, {
											language: e.target.value,
										})
									}
									className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
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

								<button
									onClick={() => handleTestCode(question.id)}
									disabled={!hasStarted || isTesting || !answer?.codeAnswer}
									className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:bg-gray-400 transition-colors"
								>
									{isTesting ? "Testing..." : "🧪 Test Code"}
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
								className="w-full min-h-[300px] p-4 border-2 border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-500 bg-gray-900 text-green-400"
								disabled={!hasStarted}
								spellCheck={false}
							/>

							{renderTestResults(question.id)}
						</div>
					)}
				</div>

				{isAnswered && (question.type === "multiple_choice" || question.type === "true_false") && (
					<div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
						<p className="text-sm font-medium text-blue-900">
							Đáp án của bạn:{" "}
							<span className="font-bold">
								{answer?.selectedChoices
									?.map((id) => {
										const idx = question.choices
											?.sort((a, b) => a.order - b.order)
											.findIndex((c) => c.id === id);
										return idx !== undefined
											? String.fromCharCode(65 + idx)
											: "";
									})
									.join(", ")}
							</span>
						</p>
					</div>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="w-full min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
					<p className="text-gray-600 font-medium">Đang tải bài tập...</p>
				</div>
			</div>
		);
	}

	if (!assignment || !assignment.questions || assignment.questions.length === 0) {
		return (
			<div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="text-6xl mb-4">📭</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Không tìm thấy bài tập
					</h2>
					<p className="text-gray-600 mb-6">
						Bài tập này chưa có câu hỏi hoặc không tồn tại
					</p>
					<button
						onClick={handleExit}
						className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
					>
						← Quay lại danh sách
					</button>
				</div>
			</div>
		);
	}

	if (!hasStarted) {
		return (
			<div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full">
					<div className="text-center mb-8">
						<div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<FileText className="w-10 h-10 text-blue-600" />
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							{assignment.title}
						</h1>
						<p className="text-gray-600">{assignment.description}</p>
					</div>

					{isLateSubmission && !assignment.allowLateSubmission && (
						<div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
							<div>
								<p className="font-medium text-red-900">Bài tập đã hết hạn nộp</p>
								<p className="text-sm text-red-700">
									Hạn nộp: {dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
								</p>
							</div>
						</div>
					)}

					<div className="grid grid-cols-4 gap-4 mb-8">
						<div className="bg-blue-50 rounded-lg p-4 text-center">
							<div className="text-sm text-gray-600 mb-1">Số câu hỏi</div>
							<div className="text-3xl font-bold text-blue-600">
								{assignment.questions.length}
							</div>
						</div>
						<div className="bg-green-50 rounded-lg p-4 text-center">
							<div className="text-sm text-gray-600 mb-1">Tổng điểm</div>
							<div className="text-3xl font-bold text-green-600">
								{assignment.maxScore}
							</div>
						</div>
						<div className="bg-purple-50 rounded-lg p-4 text-center">
							<div className="text-sm text-gray-600 mb-1">Thời gian</div>
							<div className="text-2xl font-bold text-purple-600">
								{assignment.timeLimit ? `${assignment.timeLimit}'` : "∞"}
							</div>
						</div>
						<div className="bg-orange-50 rounded-lg p-4 text-center">
							<div className="text-sm text-gray-600 mb-1">Lần nộp</div>
							<div className="text-3xl font-bold text-orange-600">
								{assignment.maxAttempts}
							</div>
						</div>
					</div>

					<div className="space-y-3">
						<button
							onClick={handleStartAssignment}
							disabled={isLateSubmission && !assignment.allowLateSubmission}
							className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							<FileText className="w-6 h-6" />
							Bắt đầu làm bài
						</button>

						<Link
							to={`/student/courses/${sectionId}/assignments/${assignmentId}/history`}
							className="w-full block py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-center transition-colors flex items-center justify-center gap-2"
						>
							<History className="w-5 h-5" />
							Xem lịch sử nộp bài
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full min-h-screen bg-gray-100 flex flex-col">
			{isLateSubmission && assignment.allowLateSubmission && (
				<div className="bg-red-600 text-white px-6 py-3 text-center font-semibold flex items-center justify-center gap-2">
					<AlertTriangle className="w-5 h-5" />
					CẢNH BÁO: Bạn đang nộp muộn! Hạn nộp đã qua vào{" "}
					{dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
				</div>
			)}

			<div className="bg-white border-b shadow-sm sticky top-0 z-30">
				<div className="max-w-screen-2xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<button
							onClick={handleExit}
							className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-md"
						>
							<Power className="w-5 h-5" />
							THOÁT
						</button>

						<div className="flex-1 text-center px-4">
							<h1 className="text-xl font-bold text-gray-900">
								Thí sinh: {user?.fullName}
							</h1>
						</div>

						<div className="flex items-center gap-4">
							{timeRemaining !== null && (
								<div
									className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xl font-bold shadow-md ${timeRemaining < 300
										? "bg-red-100 text-red-700 animate-pulse"
										: "bg-blue-100 text-blue-700"
										}`}
								>
									<Clock className="w-5 h-5" />
									{formatTime(timeRemaining)}
								</div>
							)}

							<button
								onClick={() => handleSubmit(false)}
								disabled={submitting}
								className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 shadow-md"
							>
								<Send className="w-5 h-5" />
								NỘP BÀI
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6">
				<div className="flex gap-6">
					<div className="flex-1 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
						{error && (
							<div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
								<span className="text-red-700 font-medium">{error}</span>
							</div>
						)}

						{displayQuestions.map((question, index) =>
							renderQuestion(question, index)
						)}
					</div>

					<div className="w-64 flex-shrink-0">
						<div className="bg-white rounded-lg shadow-lg p-5 sticky top-24">
							<h3 className="font-bold text-gray-900 text-center mb-4 text-lg">
								Danh sách câu hỏi
							</h3>

							<div className="grid grid-cols-5 gap-2 mb-6">
								{displayQuestions.map((question, index) => {
									const isAnswered = answers.has(question.id);

									return (
										<button
											key={question.id}
											onClick={() => scrollToQuestion(index)}
											className={`aspect-square flex items-center justify-center rounded-lg font-bold text-sm border-2 transition-all hover:scale-110 ${isAnswered
												? "bg-blue-600 text-white border-blue-700 shadow-md"
												: "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
												}`}
										>
											{index + 1}
										</button>
									);
								})}
							</div>

							<div className="border-t pt-4">
								<div className="flex items-center justify-between text-sm mb-2">
									<span className="text-gray-600">Đã làm:</span>
									<span className="font-bold text-blue-600">
										{getAnsweredCount()} / {displayQuestions.length}
									</span>
								</div>

								<div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
									<div
										className="h-3 bg-blue-600 transition-all duration-300"
										style={{
											width: `${Math.round(
												(getAnsweredCount() / displayQuestions.length) * 100
											)}%`,
										}}
									/>
								</div>

								<div className="text-center text-sm font-bold text-blue-600 mt-2">
									{Math.round(
										(getAnsweredCount() / displayQuestions.length) * 100
									)}
									%
								</div>
							</div>

							<div className="mt-6 space-y-2 text-sm border-t pt-4">
								<div className="flex items-center gap-2">
									<div className="w-6 h-6 bg-blue-600 rounded-lg"></div>
									<span className="text-gray-700">Đã trả lời</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-lg"></div>
									<span className="text-gray-700">Chưa trả lời</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}