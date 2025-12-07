import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
	Clock,
	Power,
	Send,
	AlertTriangle,
	Menu,
	X,
} from "lucide-react";
import instance from "../../utils/axiosInstance";

dayjs.locale("vi");

// ==================== TYPES ====================
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
	language: string;
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
	score?: number;
	maxScore?: number;
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

// ==================== COMPONENT ====================
export default function AssignmentsDetailsStudent() {
	const { assignmentId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	// States
	const [assignment, setAssignment] = useState<Assignment | null>(null);
	const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
	const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
	const [codeResults, setCodeResults] = useState<Map<number, CodeSubmissionResult>>(new Map());
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [testingCode, setTestingCode] = useState<Set<number>>(new Set());
	const [error, setError] = useState("");
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [isLateSubmission, setIsLateSubmission] = useState(false);

	// ✅ Mobile states
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

	// Refs
	const answersRef = useRef(answers);
	const submittingRef = useRef(submitting);

	const studentId = user?.student?.id;
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	// ✅ Handle resize
	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 768;
			setIsMobile(mobile);
			if (!mobile) setIsMobileMenuOpen(false);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Update refs
	useEffect(() => {
		answersRef.current = answers;
	}, [answers]);

	useEffect(() => {
		submittingRef.current = submitting;
	}, [submitting]);

	// Fetch assignment
	useEffect(() => {
		if (assignmentId) {
			fetchAssignmentDetails();
		}
	}, [assignmentId]);

	// Timer effect
	useEffect(() => {
		if (timeRemaining === null || timeRemaining <= 0) return;

		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(timer);
					setTimeout(() => {
						if (!submittingRef.current) handleAutoSubmit();
					}, 100);
					return 0;
				}

				if (prev === 300) {
					alert("⚠️ CHÚ Ý: Còn 5 phút!  Hãy kiểm tra và chuẩn bị nộp bài.");
				}

				if (prev === 60) {
					alert("🚨 KHẨN CẤP: Còn 1 phút! Bài sẽ được nộp tự động khi hết giờ.");
				}

				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [timeRemaining]);

	// ==================== API FUNCTIONS ====================
	const fetchAssignmentDetails = async () => {
		setLoading(true);
		try {
			const assignmentRes = await instance.get(`/assignments/${assignmentId}`);
			const assignmentData = await assignmentRes.data;

			if (!assignmentData.success) {
				setError("Không thể tải thông tin bài tập");
				setLoading(false);
				return;
			}

			const questionsRes = await instance.get(`/questions?limit=10000`);
			const questionsData = await questionsRes.data;

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
						const testCasesRes = await instance.get(
							`/test-cases/question/${question.id}`,
							{ withCredentials: true }
						);
						const testCasesData = await testCasesRes.data;
						if (testCasesData.success) {
							question.testCases = testCasesData.data || [];
						}
					} catch (err) {
						console.error(`Error fetching test cases for question ${question.id}:`, err);
					}
				}
			}

			const assignmentObj = {
				...assignmentData.data,
				questions: fullQuestions,
			};

			setAssignment(assignmentObj);

			if (assignmentObj.timeLimit) {
				setTimeRemaining(assignmentObj.timeLimit * 60);
			}

			if (assignmentObj.shuffleQuestions) {
				const shuffled = shuffleArray(fullQuestions);
				setDisplayQuestions(shuffled);
			} else {
				setDisplayQuestions(fullQuestions);
			}

			if (assignmentObj.dueDate) {
				const now = dayjs();
				const dueDate = dayjs(assignmentObj.dueDate);
				if (now.isAfter(dueDate)) {
					setIsLateSubmission(true);
				}
			}

			try {
				await instance.post(
					`/assignments/${assignmentId}/start`,
					{ studentId: studentId },
					{ withCredentials: true }
				);
			} catch (err) {
				console.error("Error auto-starting assignment:", err);
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

	// ==================== ANSWER HANDLERS ====================
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

	// ==================== CODE TEST ====================
	const handleTestCode = async (questionId: number) => {
		const answer = answers.get(questionId);

		if (!answer?.codeAnswer || !answer?.language) {
			alert("Vui lòng nhập code và chọn ngôn ngữ!");
			return;
		}

		setTestingCode((prev) => new Set(prev).add(questionId));

		try {
			const submitRes = await instance.post(
				`/assignments/${assignmentId}/submit-code`,
				{
					studentId: studentId,
					questionId: questionId,
					language: answer.language,
					codeAnswer: answer.codeAnswer,
				},
				{ withCredentials: true }
			);

			const submitData = await submitRes.data;

			if (!submitData.success) {
				alert(`❌ Lỗi: ${submitData.message}`);
				return;
			}

			const answerId = submitData.data.answer?.id || submitData.data.id;

			if (!answerId) {
				alert("❌ Không nhận được ID câu trả lời");
				return;
			}

			await new Promise((resolve) => setTimeout(resolve, 2000));

			let attempts = 0;
			const maxAttempts = 120;
			const pollInterval = 500;

			const pollResult = async (): Promise<any> => {
				attempts++;

				if (attempts > maxAttempts) {
					throw new Error("⏰ Timeout: Quá thời gian chờ kết quả (60 giây)");
				}

				const resultRes = await instance.get(
					`/assignments/answer/${answerId}/status`,
					{ withCredentials: true }
				);

				const resultData = await resultRes.data;

				if (!resultData.success) {
					throw new Error(resultData.message || "Không lấy được kết quả");
				}

				const status = resultData.data.judgeStatus;

				if (status === "queued" || status === "judging" || status === "running") {
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

			setAnswers((prev) => {
				const newAnswers = new Map(prev);
				const existingAnswer = newAnswers.get(questionId) || { questionId };
				newAnswers.set(questionId, {
					...existingAnswer,           
					score: result.score ?? 0,
					maxScore: result.maxScore ?? 0,
				});

				return newAnswers;
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

	// ==================== SUBMIT ====================
	const handleSubmit = async (isAutoSubmit: boolean = false) => {
		console.log("========== 🔥 SUBMIT START 🔥 ==========");

		if (submitting) {
			console.log("⛔ Đang submit rồi → RETURN");
			return;
		}

		console.log("isAutoSubmit =", isAutoSubmit);
		console.log("isLateSubmission =", isLateSubmission);
		console.log("assignment.allowLateSubmission =", assignment?.allowLateSubmission);

		if (!isAutoSubmit && isLateSubmission && !assignment?.allowLateSubmission) {
			alert("⚠️ Bài tập đã hết hạn nộp và không cho phép nộp muộn!");
			console.log("⛔ SUBMIT BLOCKED DO LATE");
			return;
		}

		const currentAnswers = answersRef.current;
		const answersArray = Array.from(currentAnswers.values());

		console.log("📌 answersRef.current =", currentAnswers);
		console.log("📌 answersArray =", answersArray);
		console.log("📌 displayQuestions =", displayQuestions);

		// Kiểm tra chưa trả lời
		if (!isAutoSubmit) {
			const unansweredQuestions = displayQuestions.filter((q) => !currentAnswers.has(q.id));
			console.log("🔎 unansweredQuestions =", unansweredQuestions);

			if (unansweredQuestions.length > 0) {
				if (!window.confirm(
					`Bạn còn ${unansweredQuestions.length} câu chưa trả lời.\nBạn có chắc muốn nộp bài?`
				)) {
					console.log("⛔ User CANCEL submit");
					return;
				}
			}
		}

		setSubmitting(true);
		console.log("🔄 setSubmitting(true)");

		try {
			// ===== STEP 1: Chấm code =====
			console.log("========== 🧪 STEP 1: AUTO TEST CODING ==========");

			for (const answerObj of answersArray) {
				console.log("\n--------------------------------");
				console.log("📍 Checking answerObj =", answerObj);

				const question = displayQuestions.find(q => q.id === answerObj.questionId);
				console.log("🔎 Found question =", question);

				if (!question) {
					console.log("⛔ QUESTION NOT FOUND, SKIP");
					continue;
				}

				if (question.type !== "coding") {
					console.log("⏩ Not coding → SKIP");
					continue;
				}

				console.log("🔥 Coding question detected → RUN submit-code");

				const code = answerObj.codeAnswer;
				const lang = question.language;
				console.log("💻 code =", code);
				console.log("🔤 lang =", lang);

				if (!code || !lang) {
					console.log("⛔ Missing code or lang → SKIP");
					continue;
				}

				// CALL submit-code
				console.log("➡️ Calling API: POST /submit-code");
				const submitRes = await instance.post(
					`/assignments/${assignmentId}/submit-code`,
					{
						studentId,
						questionId: question.id,
						language: lang,
						codeAnswer: code,
					},
					{ withCredentials: true }
				);

				const submitData = await submitRes.data;
				console.log("📩 submitData =", submitData);

				if (!submitData.success) {
					console.log("⛔ submit-code failed, SKIP");
					continue;
				}

				const answerId = submitData.data.answer?.id || submitData.data.id;
				console.log("🆔 answerId =", answerId);

				// Poll result
				console.log("🔁 BEGIN POLLING STATUS...");
				let attempts = 0;

				const pollResult = async (): Promise<any> => {
					attempts++;
					console.log(`⏳ Poll attempt #${attempts}`);

					const resultRes = await instance.get(
						`/assignments/answer/${answerId}/status`,
						{ withCredentials: true }
					);

					const resultData = await resultRes.data;
					console.log("📥 poll resultData =", resultData);

					if (!resultData.success) {
						console.log("⛔ Poll returned fail → STOP");
						return null;
					}

					const status = resultData.data.judgeStatus;
					console.log("📊 Status =", status);

					if (status === "queued" || status === "judging" || status === "running") {
						await new Promise(resolve => setTimeout(resolve, 400));
						return pollResult();
					}

					console.log("🏁 FINAL RESULT =", resultData.data);
					return resultData.data;
				};

				const result = await pollResult();
				console.log("🎯 FINAL result =", result);

				if (!result) {
					console.log("⛔ No result → SKIP");
					continue;
				}

				// Update answerObj
				if (result.score !== undefined) {
					console.log("📝 Update answerObj.score");
					answerObj.score = result.score;
					answerObj.maxScore = result.maxScore;
				}
			}

			console.log("========== 📦 STEP 2: SUBMIT ANSWERS ==========");
			const payload = {
				studentId,
				answers: answersArray,
			};

			console.log("📦 payload =", payload);

			const res = await instance.post(
				`/assignments/${assignmentId}/submit`,
				payload,
				{ withCredentials: true }
			);

			const data = await res.data;
			console.log("📨 response submit =", data);

			if (!data.success) {
				console.log("⛔ submit failed:", data.message);
				throw new Error(data.message);
			}

			console.log("🎉 FINAL SUBMIT SUCCESS");

			const message = isAutoSubmit
				? `⏰ Đã tự động nộp bài!\nSố câu đã làm: ${answersArray.length}/${displayQuestions.length}`
				: "🎉 Nộp bài thành công!";

			if (assignment?.showAnswersAfterSubmit) {
				alert(message + "\nBạn sẽ xem kết quả chi tiết.");
				console.log("➡️ Navigate to score page with data =", data.data);

				navigate(
					`/student/courses/${sectionId}/assignments/${assignmentId}/score`,
					{
						state: {
							...data.data,
							showAnswersAfterSubmit: true,
							payload: payload,
						},
					}
				);
			} else {
				alert(message);
				console.log("➡️ Navigate to assignments list");
				navigate(`/student/courses/${sectionId}/assignments`);
			}

		} catch (err: any) {
			console.log("❌ ERROR CAUGHT =", err);
			alert(`❌ ${err.message || "Lỗi nộp bài"}`);
		} finally {
			setSubmitting(false);
			console.log("🔄 setSubmitting(false)");
			console.log("========== 🏁 SUBMIT END 🏁 ==========\n\n");
		}
	};



	const handleAutoSubmit = () => {
		console.log("⏰ HẾT GIỜ!  Tự động nộp bài.. .");
		handleSubmit(true);
	};

	const handleExit = () => {
		const confirm = window.confirm(
			"Bạn có chắc muốn thoát?  Tiến trình làm bài sẽ không được lưu."
		);
		if (!confirm) return;
		navigate(`/student/courses/${sectionId}/assignments`);
	};

	// ==================== UTILS ====================
	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		return `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const getAnsweredCount = () => answers.size;

	const scrollToQuestion = (index: number) => {
		const element = document.getElementById(`question-${index}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "center" });
		}
		if (isMobile) {
			setIsMobileMenuOpen(false);
		}
	};

	// ==================== RENDER FUNCTIONS ====================
	const renderTestResults = (questionId: number) => {
		const result = codeResults.get(questionId);
		if (!result) return null;

		return (
			<div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded border">
				<div className="flex items-center justify-between mb-2 sm:mb-3">
					<h4 className="text-sm sm:text-base font-medium text-gray-900">Kết quả Test</h4>
					<span
						className={`text-base sm:text-lg font-bold ${result.score === result.maxScore ? "text-green-600" : "text-orange-600"
							}`}
					>
						{result.score} / {result.maxScore} điểm
					</span>
				</div>

				{result.testResults && result.testResults.length > 0 && (
					<div className="space-y-2">
						{result.testResults.map((test, index) => (
							<div
								key={test.id}
								className={`p-2 sm:p-3 rounded text-xs sm:text-sm ${test.status === "ok"
										? "bg-green-50 border border-green-200"
										: "bg-red-50 border border-red-200"
									}`}
							>
								<div className="flex justify-between items-center">
									<span className="font-medium">Test {index + 1}</span>
									<span className={test.status === "ok" ? "text-green-600" : "text-red-600"}>
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
				className="bg-white rounded-lg border shadow-sm p-4 sm:p-6 scroll-mt-24"
			>
				<div className="mb-3 sm:mb-4">
					<h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
						{index + 1}. {question.content}
					</h3>
				</div>

				<div>
					{question.type === "multiple_choice" && question.choices && (
						<div className="space-y-2 sm:space-y-3">
							{question.choices
								.sort((a, b) => a.order - b.order)
								.map((choice, idx) => {
									const label = String.fromCharCode(65 + idx);
									const isSelected = answer?.selectedChoices?.includes(choice.id) || false;
									const hasMultipleCorrect = question.choices!.filter((c) => c.isCorrect).length > 1;

									return (
										<label
											key={choice.id}
											className="flex items-start gap-2 sm:gap-3 cursor-pointer group"
										>
											<div className="flex-shrink-0 mt-0.5">
												<input
													type={hasMultipleCorrect ? "checkbox" : "radio"}
													name={`question-${question.id}`}
													checked={isSelected}
													onChange={() =>
														handleMultipleChoiceChange(question.id, choice.id, hasMultipleCorrect)
													}
													className="hidden"
												/>
												<div
													className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
															? "bg-blue-600 border-blue-600"
															: "border-gray-300 group-hover:border-blue-400"
														}`}
												>
													{isSelected && (
														<span className="text-white text-xs sm:text-sm font-bold">✓</span>
													)}
												</div>
											</div>
											<div className="flex-1 text-sm sm:text-base">
												<span className="font-bold text-gray-900 mr-1 sm:mr-2">{label}. </span>
												<span className="text-gray-700">{choice.content}</span>
											</div>
										</label>
									);
								})}
						</div>
					)}

					{question.type === "true_false" && (
						<div className="space-y-2 sm:space-y-3">
							{[
								{ id: 1, content: "Đúng", value: true },
								{ id: 2, content: "Sai", value: false },
							].map((option, idx) => {
								const label = String.fromCharCode(65 + idx);
								const isSelected = answer?.selectedChoices?.includes(option.id) || false;

								return (
									<label
										key={option.id}
										className="flex items-start gap-2 sm:gap-3 cursor-pointer group"
									>
										<div className="flex-shrink-0 mt-0.5">
											<input
												type="radio"
												name={`question-${question.id}`}
												checked={isSelected}
												onChange={() =>
													handleAnswerChange(question.id, { selectedChoices: [option.id] })
												}
												className="hidden"
											/>
											<div
												className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
														? "bg-blue-600 border-blue-600"
														: "border-gray-300 group-hover:border-blue-400"
													}`}
											>
												{isSelected && (
													<span className="text-white text-xs sm:text-sm font-bold">✓</span>
												)}
											</div>
										</div>
										<div className="flex-1 text-sm sm:text-base">
											<span className="font-bold text-gray-900 mr-1 sm:mr-2">{label}.</span>
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
									handleAnswerChange(question.id, { essayAnswer: e.target.value })
								}
								placeholder="Nhập câu trả lời của bạn..."
								className="w-full min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
							/>
							<p className="text-xs text-gray-500 mt-2">
								{answer?.essayAnswer?.length || 0} ký tự
							</p>
						</div>
					)}

					{question.type === "coding" && (
						<div>
							{/* <div className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-gray-50 p-3 rounded-lg gap-2">
								<select
									value={answer?.language || "javascript"}
									onChange={(e) =>
										handleAnswerChange(question.id, { language: e.target.value })
									}
									className="w-full sm:w-auto px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
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
									disabled={isTesting || !answer?.codeAnswer}
									className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-400 transition-colors"
								>
									{isTesting ? "Testing..." : "🧪 Test Code"}
								</button>
							</div> */}

							<textarea
								value={answer?.codeAnswer || ""}
								onChange={(e) =>
									handleAnswerChange(question.id, { codeAnswer: e.target.value })
								}
								placeholder="// Nhập code của bạn..."
								className="w-full min-h-[250px] sm:min-h-[300px] p-3 sm:p-4 border-2 border-gray-200 rounded-lg font-mono text-xs sm:text-sm focus:outline-none focus:border-blue-500 bg-gray-900 text-green-400"
								spellCheck={false}
							/>

							{renderTestResults(question.id)}
						</div>
					)}
				</div>

				{isAnswered && (question.type === "multiple_choice" || question.type === "true_false") && (
					<div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
						<p className="text-xs sm:text-sm font-medium text-blue-900">
							Đáp án của bạn:{" "}
							<span className="font-bold">
								{answer?.selectedChoices
									?.map((id) => {
										const idx = question.choices
											?.sort((a, b) => a.order - b.order)
											.findIndex((c) => c.id === id);
										return idx !== undefined ? String.fromCharCode(65 + idx) : "";
									})
									.join(", ")}
							</span>
						</p>
					</div>
				)}
			</div>
		);
	};

	// ==================== LOADING & EMPTY STATES ====================
	if (loading) {
		return (
			<div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mb-4"></div>
					<p className="text-gray-600 font-medium text-sm sm:text-base">Đang tải bài tập...</p>
				</div>
			</div>
		);
	}

	if (!assignment || !assignment.questions || assignment.questions.length === 0) {
		return (
			<div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
					<div className="text-4xl sm:text-6xl mb-4">📭</div>
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
						Không tìm thấy bài tập
					</h2>
					<p className="text-sm sm:text-base text-gray-600 mb-6">
						Bài tập này chưa có câu hỏi hoặc không tồn tại
					</p>
					<button
						onClick={handleExit}
						className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
					>
						← Quay lại danh sách
					</button>
				</div>
			</div>
		);
	}

	// ==================== MAIN RENDER ====================
	return (
		<div className="w-full min-h-screen flex flex-col">
			{/* Late Submission Warning */}
			{isLateSubmission && assignment.allowLateSubmission && (
				<div className="bg-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
					<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
					<span className="line-clamp-2 sm:line-clamp-1">
						CẢNH BÁO: Bạn đang nộp muộn!  Hạn nộp: {dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
					</span>
				</div>
			)}

			{/* Header */}
			<div className="bg-white border-b shadow-sm sticky x z-30">
				<div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-4">
					<div className="flex items-center justify-between gap-2">
						{/* Exit Button */}
						<button
							onClick={handleExit}
							className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-base font-semibold transition-colors"
						>
							<Power className="w-4 h-4 sm:w-5 sm:h-5" />
							<span className="hidden sm:inline">THOÁT</span>
						</button>

						{/* Title - Hidden on mobile */}
						<div className="hidden md:flex flex-1 text-center px-4">
							<h1 className="text-base lg:text-xl font-bold text-gray-900 truncate w-full">
								{assignment.title}
							</h1>
						</div>

						{/* Right Actions */}
						<div className="flex items-center gap-2">
							{/* Timer */}
							{timeRemaining !== null && (
								<div
									className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2. 5 rounded-lg font-mono text-sm sm:text-xl font-bold ${timeRemaining < 300
											? "bg-red-100 text-red-700 animate-pulse"
											: "bg-blue-100 text-blue-700"
										}`}
								>
									<Clock className="w-3 h-3 sm:w-5 sm:h-5" />
									<span className="hidden sm:inline">{formatTime(timeRemaining)}</span>
									<span className="inline sm:hidden">
										{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
									</span>
								</div>
							)}

							{/* Submit Button */}
							<button
								onClick={() => handleSubmit(false)}
								disabled={submitting}
								className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-base font-bold transition-colors disabled:bg-gray-400"
							>
								<Send className="w-3 h-3 sm:w-5 sm:h-5" />
								<span className="hidden sm:inline">NỘP BÀI</span>
								<span className="inline sm:hidden">NỘP</span>
							</button>

							{/* Mobile Menu Toggle */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="md:hidden p-2 bg-gray-100 rounded-lg"
							>
								{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
							</button>
						</div>
					</div>

					{/* Mobile Title */}
					<div className="md:hidden mt-2 text-center">
						<h1 className="text-sm font-bold text-gray-900 line-clamp-2">
							{assignment.title}
						</h1>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 max-w-screen-2xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-6">
				<div className="flex gap-3 sm:gap-6 relative">
					{/* Questions Column */}
					<div className={`flex-1 space-y-3 sm:space-y-5 ${isMobile ? 'pb-20' : ''}`}>
						{error && (
							<div className="p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2 sm:gap-3">
								<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
								<span className="text-xs sm:text-sm text-red-700 font-medium">{error}</span>
							</div>
						)}

						{displayQuestions.map((question, index) => renderQuestion(question, index))}
					</div>

					{/* Desktop Sidebar */}
					<div className="hidden md:block w-56 lg:w-64 flex-shrink-0">
						<div className="bg-white rounded-lg shadow-lg p-4 lg:p-5 sticky top-24">
							<h3 className="font-bold text-gray-900 text-center mb-3 lg:mb-4 text-base lg:text-lg">
								Danh sách câu hỏi
							</h3>

							<div className="grid grid-cols-5 gap-1. 5 lg:gap-2 mb-4 lg:mb-6">
								{displayQuestions.map((question, index) => {
									const isAnswered = answers.has(question.id);

									return (
										<button
											key={question.id}
											onClick={() => scrollToQuestion(index)}
											className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xs lg:text-sm border-2 transition-all hover:scale-110 ${isAnswered
													? "bg-blue-600 text-white border-blue-700 shadow-md"
													: "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
												}`}
										>
											{index + 1}
										</button>
									);
								})}
							</div>

							<div className="border-t pt-3 lg:pt-4">
								<div className="flex items-center justify-between text-xs lg:text-sm mb-2">
									<span className="text-gray-600">Đã làm:</span>
									<span className="font-bold text-blue-600">
										{getAnsweredCount()} / {displayQuestions.length}
									</span>
								</div>

								<div className="w-full bg-gray-200 h-2. 5 lg:h-3 rounded-full overflow-hidden">
									<div
										className="h-full bg-blue-600 transition-all duration-300"
										style={{
											width: `${Math.round((getAnsweredCount() / displayQuestions.length) * 100)}%`,
										}}
									/>
								</div>

								<div className="text-center text-xs lg:text-sm font-bold text-blue-600 mt-2">
									{Math.round((getAnsweredCount() / displayQuestions.length) * 100)}%
								</div>
							</div>

							<div className="mt-4 lg:mt-6 space-y-2 text-xs lg:text-sm border-t pt-3 lg:pt-4">
								<div className="flex items-center gap-2">
									<div className="w-5 h-5 lg:w-6 lg:h-6 bg-blue-600 rounded-lg"></div>
									<span className="text-gray-700">Đã trả lời</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-5 h-5 lg:w-6 lg:h-6 bg-white border-2 border-gray-300 rounded-lg"></div>
									<span className="text-gray-700">Chưa trả lời</span>
								</div>
							</div>
						</div>
					</div>

					{/* Mobile Bottom Sheet */}
					{isMobile && (
						<>
							{/* Backdrop */}
							{isMobileMenuOpen && (
								<div
									className="fixed inset-0 bg-black bg-opacity-50 z-40"
									onClick={() => setIsMobileMenuOpen(false)}
								/>
							)}

							{/* Bottom Sheet */}
							<div
								className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
									}`}
								style={{ maxHeight: '70vh' }}
							>
								<div className="p-4 overflow-y-auto max-h-[70vh]">
									{/* Handle */}
									<div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

									<h3 className="font-bold text-gray-900 text-center mb-4">
										Danh sách câu hỏi
									</h3>

									<div className="grid grid-cols-5 gap-2 mb-4">
										{displayQuestions.map((question, index) => {
											const isAnswered = answers.has(question.id);

											return (
												<button
													key={question.id}
													onClick={() => scrollToQuestion(index)}
													className={`aspect-square flex items-center justify-center rounded-lg font-bold text-sm border-2 transition-all ${isAnswered
															? "bg-blue-600 text-white border-blue-700"
															: "bg-white text-gray-700 border-gray-300"
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
												className="h-full bg-blue-600 transition-all duration-300"
												style={{
													width: `${Math.round((getAnsweredCount() / displayQuestions.length) * 100)}%`,
												}}
											/>
										</div>

										<div className="text-center text-sm font-bold text-blue-600 mt-2">
											{Math.round((getAnsweredCount() / displayQuestions.length) * 100)}%
										</div>
									</div>

									<div className="mt-4 space-y-2 text-sm border-t pt-4">
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

							{/* Mobile Floating Menu Button */}
							{!isMobileMenuOpen && (
								<button
									onClick={() => setIsMobileMenuOpen(true)}
									className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-30 active:scale-95 transition-transform"
								>
									<Menu className="w-6 h-6" />
								</button>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}