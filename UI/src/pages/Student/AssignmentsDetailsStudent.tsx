import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";

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

interface Question {
	id: number;
	type: QuestionType;
	content: string;
	explanation: string | null;
	points: number;
	order: number;
	choices: QuestionChoice[];
	testCases?: any[];
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

export default function AssignmentsDetailsStudent() {
	const { assignmentId } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [assignment, setAssignment] = useState<Assignment | null>(null);
	const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [hasStarted, setHasStarted] = useState(false);

	const studentId = user?.student?.id;
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	useEffect(() => {
		if (assignmentId) {
			fetchAssignmentDetails();
		}
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
			// 1. Fetch assignment info
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

			console.log("Assignment data:", assignmentData.data);

			// 2. Fetch all questions details
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

			console.log("Questions data:", questionsData.data);

			// 3. Map questionId to full question details
			const assignmentQuestions = assignmentData.data.questions || [];
			const allQuestions = questionsData.data || [];

			const questionIds = assignmentQuestions.map((q: any) => q.questionId);
			const questionsMap = new Map(
				allQuestions.map((q: Question) => [q.id, q])
			);

			const fullQuestions: Question[] = questionIds
				.map((id: number) => questionsMap.get(id))
				.filter((q:any): q is Question => q !== undefined)
				.sort((a:any, b:any) => a.order - b.order);

			console.log("Full questions:", fullQuestions);

			setAssignment({
				...assignmentData.data,
				questions: fullQuestions,
			});
		} catch (err) {
			console.error("Fetch error:", err);
			setError("Lỗi kết nối server");
		} finally {
			setLoading(false);
		}
	};

	const handleStartAssignment = async () => {
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

	const handleSubmit = async () => {
		const unansweredQuestions = assignment?.questions.filter(
			(q) => !answers.has(q.id)
		);

		if (unansweredQuestions && unansweredQuestions.length > 0) {
			const confirm = window.confirm(
				`Bạn còn ${unansweredQuestions.length} câu chưa trả lời.\nBạn có chắc muốn nộp bài?`
			);
			if (!confirm) return;
		}

		setSubmitting(true);
		try {
			const answersArray = Array.from(answers.values());

			// 👇 THÊM LOG ĐỂ DEBUG
			console.log("=== SUBMIT DATA ===");
			console.log("Assignment ID:", assignmentId);
			console.log("Answers Array:", answersArray);
			console.log("Answers Count:", answersArray.length);
			console.log("JSON Body:", JSON.stringify({ answers: answersArray }, null, 2));

			const res = await fetch(
				`http://localhost:4000/api/v1/assignments/${assignmentId}/submit`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({
						answers: answersArray,
						studentId: studentId,
					}),
				}
			);

			const data = await res.json();

			// 👇 LOG RESPONSE
			console.log("=== SUBMIT RESPONSE ===");
			console.log("Status:", res.status);
			console.log("Response:", data);

			if (data.success) {
				alert("✅ Nộp bài thành công!");
				navigate(`/student/courses/${sectionId}/assignments`);
			} else {
				setError(data.message || "Nộp bài thất bại");
				alert(`❌ ${data.message || "Nộp bài thất bại"}`);
			}
		} catch (err) {
			console.error("Error submitting:", err);
			setError("Lỗi khi nộp bài");
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
		navigate(`/student/sections/${sectionId}/assignments`);
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

	const renderQuestion = (question: Question, index: number) => {
		const answer = answers.get(question.id);

		return (
			<div key={question.id} className="bg-white rounded-lg border p-6 mb-4">
				{/* Question Header */}
				<div className="flex items-start justify-between mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-2">
							<span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded">
								Câu {index + 1}
							</span>
							<span className="text-sm text-gray-600">
								({question.points} điểm)
							</span>
						</div>
						<p className="text-gray-900 whitespace-pre-wrap">
							{question.content}
						</p>
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
													? "bg-blue-50 border-blue-500"
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
											<span className="flex-1 text-gray-900">
												{choice.content}
											</span>
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
												? "bg-blue-50 border-blue-500"
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
										<span className="flex-1 text-gray-900">
											{option.content}
										</span>
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
								className="w-full min-h-[150px] p-3 border rounded focus:outline-none focus:border-blue-500"
								disabled={!hasStarted}
							/>
							<p className="text-xs text-gray-600 mt-2">
								{answer?.essayAnswer?.length || 0} ký tự
							</p>
						</div>
					)}

					{question.type === "coding" && (
						<div>
							<div className="mb-2">
								<label className="text-sm text-gray-700">Ngôn ngữ:</label>
								<select
									value={answer?.language || "javascript"}
									onChange={(e) =>
										handleAnswerChange(question.id, { language: e.target.value })
									}
									className="ml-2 px-3 py-1 border rounded text-sm"
									disabled={!hasStarted}
								>
									<option value="javascript">JavaScript</option>
									<option value="python">Python</option>
									<option value="java">Java</option>
									<option value="cpp">C++</option>
									<option value="csharp">C#</option>
								</select>
							</div>
							<textarea
								value={answer?.codeAnswer || ""}
								onChange={(e) =>
									handleAnswerChange(question.id, {
										codeAnswer: e.target.value,
									})
								}
								placeholder="// Nhập code của bạn..."
								className="w-full min-h-[200px] p-3 border rounded font-mono text-sm focus:outline-none focus:border-blue-500"
								disabled={!hasStarted}
							/>
						</div>
					)}
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
				<p className="text-gray-600">Đang tải...</p>
			</div>
		);
	}

	if (!assignment) {
		return (
			<div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-red-600 mb-4">Không tìm thấy bài tập</p>
					<button onClick={handleBack} className="text-blue-600 hover:underline">
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
						<button onClick={handleBack} className="text-sm text-blue-600 hover:underline mb-2">
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
		<div className="w-full min-h-screen bg-gray-50 pb-20">
			{/* Header */}
			<div className="bg-white border-b sticky top-0 z-10">
				<div className="px-4 py-4">
					<button onClick={handleBack} className="text-sm text-blue-600 hover:underline mb-2">
						← Quay lại
					</button>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-xl font-medium text-gray-900">
								{assignment.title}
							</h1>
							{assignment.description && (
								<p className="text-sm text-gray-600 mt-1">
									{assignment.description}
								</p>
							)}
						</div>
						{hasStarted && timeRemaining !== null && (
							<div
								className={`text-right ${timeRemaining < 300 ? "text-red-600" : "text-gray-900"
									}`}
							>
								<div className="text-2xl font-bold font-mono">
									{formatTime(timeRemaining)}
								</div>
								<div className="text-xs">Thời gian còn lại</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Info Bar */}
			<div className="bg-white border-b px-4 py-3">
				<div className="flex flex-wrap gap-4 text-sm text-gray-600">
					<div>
						<span className="font-medium">Tổng câu hỏi:</span>{" "}
						{assignment.questions.length}
					</div>
					<div>
						<span className="font-medium">Tổng điểm:</span> {assignment.maxScore}
					</div>
					{assignment.timeLimit && (
						<div>
							<span className="font-medium">Thời gian:</span>{" "}
							{assignment.timeLimit} phút
						</div>
					)}
					<div>
						<span className="font-medium">Đã trả lời:</span>{" "}
						<span
							className={
								getAnsweredCount() === assignment.questions.length
									? "text-green-600 font-medium"
									: "text-blue-600 font-medium"
							}
						>
							{getAnsweredCount()} / {assignment.questions.length}
						</span>
					</div>
					{assignment.dueDate && (
						<div>
							<span className="font-medium">Hạn nộp:</span>{" "}
							{dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
						</div>
					)}
				</div>
			</div>

			{/* Error */}
			{error && (
				<div className="px-4 py-3">
					<div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
						{error}
					</div>
				</div>
			)}

			{/* Start Button */}
			{!hasStarted && (
				<div className="px-4 py-8">
					<div className="max-w-2xl mx-auto bg-white rounded-lg border p-8 text-center">
						<div className="text-4xl mb-4">📝</div>
						<h2 className="text-xl font-medium text-gray-900 mb-4">
							Sẵn sàng làm bài?
						</h2>
						<p className="text-gray-600 mb-6">
							Nhấn nút bên dưới để bắt đầu làm bài tập.
							{assignment.timeLimit && (
								<> Bạn sẽ có {assignment.timeLimit} phút để hoàn thành.</>
							)}
						</p>
						<button
							onClick={handleStartAssignment}
							className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
						>
							Bắt đầu làm bài
						</button>
					</div>
				</div>
			)}

			{/* Questions */}
			{hasStarted && (
				<div className="px-4 py-6 max-w-4xl mx-auto">
					{assignment.questions.map((question, index) =>
						renderQuestion(question, index)
					)}
				</div>
			)}

			{/* Submit Button */}
			{hasStarted && (
				<div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
					<div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
						<div className="text-sm text-gray-600">
							Đã trả lời: {getAnsweredCount()} / {assignment.questions.length}
						</div>
						<button
							onClick={handleSubmit}
							disabled={submitting}
							className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
						>
							{submitting ? "Đang nộp bài..." : "Nộp bài"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}