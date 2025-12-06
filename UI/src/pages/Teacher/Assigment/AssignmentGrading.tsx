import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	Tag,
	Tooltip,
	Modal,
	Row,
	Col,
	InputNumber,
	Space,
	Badge,
	Popconfirm,
	Divider,
	Input,
} from "antd";
import {
	HistoryOutlined,
	SaveOutlined,
	EditOutlined,
	StarOutlined,
	StarFilled,
	EyeOutlined,
	FileTextOutlined,
	CheckCircleOutlined,
	PlayCircleOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import instance from "../../../utils/axiosInstance";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type Submission = {
	id: number;
	assignmentId: number;
	studentId: number;
	filePath?: string;
	answerText?: string;
	score?: number;
	maxScore?: number;
	autoGraded: boolean;
	feedback?: string;
	submittedAt: string;
	gradedAt?: string;
	startedAt: string;
	completedAt: string;
	attempt?: number;
	isFinal?: boolean;
};

type Student = {
	id: number;
	userId: number;
	studentCode: string;
	className: string;
	major: string;
	user: {
		id: number;
		fullName: string;
		email: string;
	};
};

type Assignment = {
	id: number;
	title: string;
	maxScore: number;
	passingScore?: number;
	submissions?: Submission[];
};

export default function AssignmentGrading() {
	const { assignmentId } = useParams<{ assignmentId: string }>();
	const navigate = useNavigate();
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [loading, setLoading] = useState(true);
	const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
	const [students, setStudents] = useState<Student[]>([]);

	// Modal xem lịch sử nộp bài
	const [submissionHistoryModalOpen, setSubmissionHistoryModalOpen] = useState(false);
	const [selectedStudentSubmissions, setSelectedStudentSubmissions] = useState<Submission[]>([]);
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [loadingSubmissions, setLoadingSubmissions] = useState(false);

	// State cho việc sửa điểm
	const [editingScore, setEditingScore] = useState<{ submissionId: number; score: number } | null>(null);

	// State cho modal chi tiết submission
	const [submissionDetailModalOpen, setSubmissionDetailModalOpen] = useState(false);
	const [submissionDetail, setSubmissionDetail] = useState<any>(null);
	const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);

	// 🔥 State cho chấm điểm answer (essay/code)
	const [editingAnswerScore, setEditingAnswerScore] = useState<{
		answerId: number;
		score: number;
		maxScore: number;
	} | null>(null);

	// 🔥 State cho chạy lại code
	const [reGradingCode, setReGradingCode] = useState<Set<number>>(new Set());

	useEffect(() => {
		fetchStudents();
	}, [assignmentId, sectionId]);

	useEffect(() => {
		if (students.length > 0) {
			fetchAssignmentWithSubmissions();
		}
	}, [students]);

	const fetchStudents = async () => {
		try {
			const res = await instance.get<{ success: boolean; data: any[] }>(
				`/sections-enrollments/section/${sectionId}/students`
			);
			if (res.data.success) {
				setStudents(res.data.data.map((item: any) => item.student) || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải danh sách học sinh:", err);
			toast.error("Không tải được danh sách học sinh");
		}
	};

	const fetchAssignmentWithSubmissions = async () => {
		try {
			setLoading(true);

			const assignmentRes = await instance.get<{ success: boolean; data: Assignment }>(
				`/assignments/${assignmentId}`
			);

			console.log(assignmentRes);

			if (!assignmentRes.data.success) {
				toast.error("Không tải được thông tin bài tập");
				return;
			}

			const assignment = assignmentRes.data.data;
			console.log("studentsstudentsstudentsstudentsstudents", students);
			const allSubmissionsPromises = students.map(async (student) => {
				try {
					const res = await instance.get<{ success: boolean; data: Submission[] }>(
						`/assignments/${assignmentId}/student/${student.id}/submissions`
					);

					if (res.data.success && res.data.data) {
						// 🔥 Ưu tiên submission có isFinal = true
						const finalSubmission = res.data.data.find(sub => sub.isFinal === true);

						if (finalSubmission) {
							return finalSubmission;
						}

						// 🔥 Nếu không có isFinal, lấy submission MỚI NHẤT
						const sortedSubmissions = res.data.data.sort(
							(a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
						);

						return sortedSubmissions[0] || null;
					}
					return null;
				} catch (err) {
					console.error(`Lỗi khi lấy submissions của học sinh ${student.id}:`, err);
					return null;
				}
			});


			const allSubmissions = await Promise.all(allSubmissionsPromises);
			console.log("allSubmissions:", allSubmissions);
			const finalSubmissions = allSubmissions.filter(sub => sub !== null) as Submission[];

			setSelectedAssignment({
				...assignment,
				submissions: finalSubmissions,
			});
		} catch (err) {
			console.error("Lỗi khi tải chi tiết bài tập:", err);
			toast.error("Không tải được thông tin bài tập");
		} finally {
			setLoading(false);
		}
	};

	const fetchStudentSubmissions = async (studentId: number, assignmentId: number) => {
		try {
			setLoadingSubmissions(true);
			const res = await instance.get<{ success: boolean; data: Submission[] }>(
				`/assignments/${assignmentId}/student/${studentId}/submissions`
			);

			if (res.data.success) {
				const sortedSubmissions = (res.data.data || []).sort(
					(a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
				);
				setSelectedStudentSubmissions(sortedSubmissions);
				const student = students.find(s => s.id === studentId);
				setSelectedStudent(student || null);
				setSubmissionHistoryModalOpen(true);
			}
		} catch (err) {
			console.error("Lỗi khi tải lịch sử nộp bài:", err);
			toast.error("Không tải được lịch sử nộp bài");
		} finally {
			setLoadingSubmissions(false);
		}
	};

	const fetchSubmissionDetail = async (submissionId: number) => {
		try {
			setLoadingSubmissionDetail(true);

			const submissionRes = await instance.get<{ success: boolean; data: any }>(
				`/submissions/${submissionId}`
			);

			const answersRes = await instance.get<{ success: boolean; data: any[] }>(
				`/submission-answers/submission/${submissionId}`
			);

			console.log("aaaaa",submissionRes, answersRes);

			const answersWithQuestions = await Promise.all(
				(answersRes.data.data || []).map(async (answer: any) => {
					try {
						const questionRes = await instance.get(
							`/questions/${answer.questionId}`
						);
						console.log("Fetched question:", questionRes.data);
						if (questionRes.data.success) {
							return { ...answer, question: questionRes.data.data };
						}
						return answer;
					} catch {
						return answer;
					}
				})
			);

			setSubmissionDetail({
				submission: submissionRes.data.data,
				answers: answersWithQuestions.sort((a: any, b: any) =>
					(a.question?.order || 0) - (b.question?.order || 0)
				),
			});

			setSubmissionDetailModalOpen(true);
		} catch (err) {
			console.error("Lỗi khi tải chi tiết bài làm:", err);
			toast.error("Không tải được chi tiết bài làm");
		} finally {
			setLoadingSubmissionDetail(false);
		}
	};

	const handleUpdateScore = async (submissionId: number, newScore: number) => {
		try {
			const res = await instance.put(
				`/submissions/${submissionId}`,
				{ score: newScore }
			);

			if (res.data.success) {
				toast.success("Đã cập nhật điểm");

				setSelectedStudentSubmissions(prev =>
					prev.map(sub =>
						sub.id === submissionId ? { ...sub, score: newScore } : sub
					)
				);

				fetchAssignmentWithSubmissions();
				setEditingScore(null);
			}
		} catch (err) {
			console.error("Lỗi khi cập nhật điểm:", err);
			toast.error("Không thể cập nhật điểm");
		}
	};

	// 🔥 HÀM CẬP NHẬT ĐIỂM CHO ANSWER (Essay/Code)
	const handleUpdateAnswerScore = async (answerId: number, newScore: number) => {
		try {
			const res = await instance.put(
				`/submission-answers/${answerId}`,
				{ score: newScore }
			);
console.log("res:", res);
			if (res.data.success) {
				toast.success("Đã cập nhật điểm câu trả lời");

				// Cập nhật lại submissionDetail
				setSubmissionDetail((prev: any) => ({
					...prev,
					answers: prev.answers.map((ans: any) =>
						ans.id === answerId ? { ...ans, score: newScore } : ans
					),
				}));

				// Tính lại tổng điểm submission
				const updatedAnswers = submissionDetail.answers.map((ans: any) =>
					ans.id === answerId ? { ...ans, score: newScore } : ans
				);
				const totalScore = updatedAnswers.reduce((sum: number, ans: any) => sum + (ans.score || 0), 0);

				// Cập nhật điểm submission
				await instance.put(
					`/submissions/${submissionDetail.submission.id}`,
					{ score: totalScore }
				);

				setEditingAnswerScore(null);

				// Refresh submission detail
				fetchSubmissionDetail(submissionDetail.submission.id);
			}
		} catch (err) {
			console.error("Lỗi khi cập nhật điểm:", err);
			toast.error("Không thể cập nhật điểm");
		}
	};
	console.log(submissionDetail);

	// 🔥 HÀM CHẠY LẠI CODE (Re-grade)
	const handleReGradeCode = async (answerId: number, questionId: number) => {
		const answer = submissionDetail.answers.find((a: any) => a.id === answerId);
		const submission = submissionDetail.submission;
		const question = answer?.question;

		console.log("Re-grading code for answer:", answer);

		if (!answer?.codeAnswer) {
			toast.error("Không có code để chấm");
			return;
		}

		// 🔥 LẤY LANGUAGE: Ưu tiên answer.language, nếu null thì lấy question.language
		const language = answer.language || question?.language;

		if (!language) {
			toast.error("Không xác định được ngôn ngữ lập trình");
			return;
		}

		// 🔥 LẤY STUDENT ID TỪ SUBMISSION
		const studentId = submission.studentId;

		if (!studentId) {
			toast.error("Không tìm thấy thông tin học sinh");
			return;
		}

		setReGradingCode(prev => new Set(prev).add(answerId));

		try {
			console.log("📤 Submitting code for re-grading with language:", language);

			// 🔥 GỌI API SUBMIT-CODE
			const submitRes = await instance.post(
				`/assignments/${assignmentId}/submit-code`,
				{
					studentId: studentId,
					questionId: questionId,
					language: language,
					codeAnswer: answer.codeAnswer,
				}
			);

			if (!submitRes.data.success) {
				toast.error(`❌ Lỗi: ${submitRes.data.message}`);
				return;
			}

			const newAnswerId = submitRes.data.data.answer?.id || submitRes.data.data.id;

			if (!newAnswerId) {
				console.error("❌ No answerId in response:", submitRes.data);
				toast.error("❌ Không nhận được ID câu trả lời");
				return;
			}

			console.log("✅ New Answer ID:", newAnswerId);

			toast.success("Đang chạy lại code.. .");

			// 🔥 ĐỢI LÂU HƠN TRƯỚC KHI BẮT ĐẦU POLL
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// 🔥 POLLING ĐỂ LẤY KẾT QUẢ
			let attempts = 0;
			const maxAttempts = 120;
			const pollInterval = 500;

			const pollResult = async (): Promise<any> => {
				attempts++;

				console.log(`🔄 Polling attempt ${attempts}`);

				if (attempts > maxAttempts) {
					throw new Error("⏰ Timeout: Quá thời gian chờ kết quả (60 giây)");
				}

				const resultRes = await instance.get(
					`/assignments/answer/${newAnswerId}/status`
				);

				console.log(`🔄 Polling attempt ${attempts} Result:`, resultRes.data);

				if (!resultRes.data.success) {
					throw new Error(resultRes.data.message || "Không lấy được kết quả");
				}

				const status = resultRes.data.data.judgeStatus;

				// 🔥 TIẾP TỤC POLL NẾU ĐANG XỬ LÝ
				if (status === "queued" || status === "judging" || status === "running") {
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
					return pollResult();
				}

				if (status === "error") {
					throw new Error(
						resultRes.data.data.stderrLog ||
						resultRes.data.data.compileLog ||
						"Lỗi khi chạy code"
					);
				}

				return resultRes.data.data;
			};

			const result = await pollResult();

			const score = result.score ?? 0;
			const maxScore = result.maxScore ?? 0;
			const testResults = result.testResults || [];
			const passedCount = testResults.filter((t: any) => t.status === "ok" || t.isPassed).length;

			// 🔥 CẬP NHẬT ĐIỂM VÀO ANSWER CŨ (answerId GỐC)
			console.log(`📤 Updating score for answer ${answerId}:`, { score, maxScore });

			try {
				const updateRes = await instance.put(
					`/submission-answers/${answerId}`,
					{
						score: score,
						judgeStatus: result.judgeStatus,
						compileLog: result.compileLog,
						stdoutLog: result.stdoutLog,
						stderrLog: result.stderrLog,
						testResults: testResults,
					}
				);

				if (updateRes.data.success) {
					console.log("✅ Score updated successfully");
					toast.success(
						`✅ Chấm xong!\n\n` +
						`📊 Điểm: ${score}/${maxScore}\n` +
						`✓ Test cases passed: ${passedCount}/${testResults.length}\n` +
						`${score === maxScore ? "🎉 Perfect!" : "💪 Cố gắng thêm!"}`
					);
				} else {
					throw new Error("Không thể cập nhật điểm");
				}
			} catch (updateErr: any) {
				console.error("❌ Error updating score:", updateErr);
				toast.error("Đã chấm xong nhưng không cập nhật được điểm");
			}

			// 🔥 REFRESH SUBMISSION DETAIL ĐỂ LẤY ĐIỂM MỚI
			await fetchSubmissionDetail(submission.id);

		} catch (err: any) {
			console.error("❌ Error re-grading code:", err);
			toast.error(err.message || "Lỗi khi chạy lại code");
		} finally {
			setReGradingCode(prev => {
				const newSet = new Set(prev);
				newSet.delete(answerId);
				return newSet;
			});
		}
	};


	const handleSelectFinalSubmission = async (submissionId: number) => {
		try {
			const submission = selectedStudentSubmissions.find(s => s.id === submissionId);
			if (!submission) {
				toast.error("Không tìm thấy submission");
				return;
			}

			if (submission.score === null || submission.score === undefined) {
				toast.error("Submission này chưa có điểm, vui lòng chấm điểm trước");
				return;
			}

			const res = await instance.post(
				`/submissions/${submissionId}/select-final`
			);

			if (res.data.success) {
				toast.success("Đã chọn làm điểm chính thức");

				setSelectedStudentSubmissions(prev =>
					prev.map(sub => ({
						...sub,
						isFinal: sub.id === submissionId
					}))
				);

				await fetchAssignmentWithSubmissions();
			} else {
				toast.error(res.data.message || "Không thể chọn điểm chính thức");
			}
		} catch (err: any) {
			console.error("Lỗi khi chọn điểm chính thức:", err);
			toast.error(err?.response?.data?.message || "Không thể chọn điểm chính thức");
		}
	};

	const getScoreTableData = () => {
		if (!selectedAssignment) return [];

		return students.map((student) => {
			const studentSubmissions = selectedAssignment.submissions?.filter(
				(sub) => sub.studentId === student.id
			) || [];

			const latestSubmission = studentSubmissions.length > 0
				? studentSubmissions.sort((a, b) =>
					new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
				)[0]
				: null;

			return {
				key: student.id,
				studentId: student.id,
				studentCode: student.studentCode,
				fullName: student.user.fullName,
				email: student.user.email,
				className: student.className,
				submissionCount: studentSubmissions.length,
				submittedAt: latestSubmission?.submittedAt,
				score: latestSubmission?.score,
				maxScore: selectedAssignment.maxScore,
				status: latestSubmission
					? latestSubmission.score !== null && latestSubmission.score !== undefined
						? "graded"
						: "submitted"
					: "not_submitted",
			};
		});
	};

	const scoreColumns = [
		{
			title: "MSSV",
			dataIndex: "studentCode",
			key: "studentCode",
			width: 120,
			fixed: "left" as const,
		},
		{
			title: "Họ và tên",
			dataIndex: "fullName",
			key: "fullName",
			width: 200,
			fixed: "left" as const,
			render: (text: string) => <strong>{text}</strong>,
		},
		{
			title: "Lớp",
			dataIndex: "className",
			key: "className",
			width: 100,
		},
		{
			title: "Email",
			dataIndex: "email",
			key: "email",
			width: 200,
		},
		{
			title: "Số bài nộp",
			dataIndex: "submissionCount",
			key: "submissionCount",
			width: 120,
			align: "center" as const,
			render: (count: number) => (
				<Badge
					count={count}
					showZero
					style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }}
				/>
			),
		},
		{
			title: "Trạng thái",
			dataIndex: "status",
			key: "status",
			width: 120,
			align: "center" as const,
			render: (status: string) => {
				if (status === "graded") {
					return <Tag color="success">Đã chấm</Tag>;
				} else if (status === "submitted") {
					return <Tag color="warning">Chưa chấm</Tag>;
				} else {
					return <Tag color="default">Chưa nộp</Tag>;
				}
			},
		},
		{
			title: "Thời gian nộp",
			dataIndex: "submittedAt",
			key: "submittedAt",
			width: 150,
			render: (date: string) =>
				date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
		},
		{
			title: "Điểm",
			key: "score",
			width: 120,
			align: "center" as const,
			render: (_: any, record: any) => {
				if (record.score !== null && record.score !== undefined) {
					const percent = (record.score / record.maxScore) * 100;
					let color = "default";
					if (percent >= 80) color = "success";
					else if (percent >= 50) color = "warning";
					else color = "error";

					return (
						<Tag color={color}>
							{record.score}/{record.maxScore}
						</Tag>
					);
				}
				return "-";
			},
		},
		{
			title: "Hành động",
			key: "actions",
			width: 120,
			align: "center" as const,
			render: (_: any, record: any) => (
				<Space>
					{record.submissionCount > 0 && (
						<Tooltip title="Xem lịch sử nộp bài">
							<Button
								type="link"
								size="small"
								icon={<HistoryOutlined />}
								onClick={() => fetchStudentSubmissions(record.studentId, Number(assignmentId))}
							/>
						</Tooltip>
					)}
				</Space>
			),
		},
	];

	const submissionHistoryColumns = [
		{
			title: "Lần",
			key: "index",
			width: 60,
			align: "center" as const,
			render: (_: any, __: any, index: number) => (
				<strong>{selectedStudentSubmissions.length - index}</strong>
			),
		},
		{
			title: "Điểm chính thức",
			key: "isFinal",
			width: 100,
			align: "center" as const,
			render: (_: any, record: Submission) => (
				record.isFinal ? (
					<Tooltip title="Đây là điểm chính thức">
						<StarFilled style={{ fontSize: 20, color: '#faad14' }} />
					</Tooltip>
				) : null
			),
		},
		{
			title: "Thời gian nộp",
			dataIndex: "submittedAt",
			key: "submittedAt",
			width: 150,
			render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
		},
		{
			title: "Thời gian làm",
			key: "duration",
			width: 120,
			render: (_: any, record: Submission) => {
				const duration = dayjs(record.completedAt).diff(dayjs(record.startedAt), 'minute');
				return `${duration} phút`;
			},
		},
		{
			title: "Điểm",
			key: "score",
			width: 150,
			align: "center" as const,
			render: (_: any, record: Submission) => {
				if (editingScore?.submissionId === record.id) {
					return (
						<Space>
							<InputNumber
								min={0}
								max={record.maxScore}
								value={editingScore.score}
								onChange={(val) => setEditingScore({ ...editingScore, score: val || 0 })}
								style={{ width: 80 }}
							/>
							<Button
								type="primary"
								size="small"
								icon={<SaveOutlined />}
								onClick={() => handleUpdateScore(record.id, editingScore.score)}
							>
								Lưu
							</Button>
							<Button
								size="small"
								onClick={() => setEditingScore(null)}
							>
								Hủy
							</Button>
						</Space>
					);
				}

				if (record.score !== null && record.score !== undefined) {
					const percent = (record.score / record.maxScore!) * 100;
					let color = "default";
					if (percent >= 80) color = "success";
					else if (percent >= 50) color = "warning";
					else color = "error";

					return (
						<Space>
							<Tag color={color}>
								{record.score}/{record.maxScore}
							</Tag>
							<Button
								type="link"
								size="small"
								icon={<EditOutlined />}
								onClick={() => setEditingScore({ submissionId: record.id, score: record.score! })}
							>
								Sửa
							</Button>
						</Space>
					);
				}
				return <Tag color="default">Chưa chấm</Tag>;
			},
		},
		{
			title: "Trạng thái",
			key: "autoGraded",
			width: 120,
			align: "center" as const,
			render: (_: any, record: Submission) => (
				<Tag color={record.autoGraded ? "blue" : "orange"}>
					{record.autoGraded ? "Tự động" : "Thủ công"}
				</Tag>
			),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 250,
			align: "center" as const,
			render: (_: any, record: Submission) => (
				<Space>
					<Tooltip title="Xem chi tiết bài làm">
						<Button
							size="small"
							icon={<EyeOutlined />}
							onClick={() => fetchSubmissionDetail(record.id)}
						>
							Chi tiết
						</Button>
					</Tooltip>

					{!record.isFinal && record.score !== null && record.score !== undefined && (
						<Popconfirm
							title="Chọn làm điểm chính thức?"
							description="Điểm này sẽ được dùng để tính điểm cuối cùng cho học sinh."
							onConfirm={() => handleSelectFinalSubmission(record.id)}
							okText="Xác nhận"
							cancelText="Hủy"
						>
							<Tooltip title="Chọn làm điểm chính thức">
								<Button
									size="small"
									type="dashed"
									icon={<StarOutlined />}
									style={{ color: '#faad14', borderColor: '#faad14' }}
								>
									Chọn
								</Button>
							</Tooltip>
						</Popconfirm>
					)}
				</Space>
			),
		},
	];

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: 60 }}>
				<Spin size="large" tip="Đang tải..." />
			</div>
		);
	}

	return (
		<div style={{ padding: 16 }}>
			<div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<Title level={3}>
					<FileTextOutlined style={{ marginRight: 8 }} />
					{selectedAssignment?.title} - Bảng điểm
				</Title>
				<Button onClick={() => navigate(`/teacher/courses/${sectionId}/assignments`)}>
					← Quay lại
				</Button>
			</div>

			<Table
				dataSource={getScoreTableData()}
				columns={scoreColumns}
				rowKey="key"
				bordered
				pagination={{ pageSize: 10 }}
				scroll={{ x: 1200 }}
				locale={{ emptyText: "Không có dữ liệu" }}
			/>

			{/* Modal xem lịch sử nộp bài */}
			<Modal
				title={
					<div>
						<HistoryOutlined style={{ marginRight: 8 }} />
						Lịch sử nộp bài - {selectedStudent?.user.fullName} ({selectedStudent?.studentCode})
					</div>
				}
				open={submissionHistoryModalOpen}
				onCancel={() => {
					setSubmissionHistoryModalOpen(false);
					setSelectedStudent(null);
					setSelectedStudentSubmissions([]);
					setEditingScore(null);
				}}
				footer={[
					<Button key="close" onClick={() => {
						setSubmissionHistoryModalOpen(false);
						setSelectedStudent(null);
						setSelectedStudentSubmissions([]);
						setEditingScore(null);
					}}>
						Đóng
					</Button>,
				]}
				width={1300}
				centered
			>
				{loadingSubmissions ? (
					<div style={{ textAlign: "center", padding: 40 }}>
						<Spin size="large" tip="Đang tải lịch sử nộp bài..." />
					</div>
				) : (
					<>
						<div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
							<Row gutter={16}>
								<Col span={8}>
									<Text strong>Bài tập: </Text>
									<Text>{selectedAssignment?.title}</Text>
								</Col>
								<Col span={8}>
									<Text strong>Tổng số lần nộp: </Text>
									<Badge count={selectedStudentSubmissions.length} showZero />
								</Col>
								<Col span={8}>
									<Text strong>Điểm tối đa: </Text>
									<Text>{selectedAssignment?.maxScore}</Text>
								</Col>
							</Row>
						</div>

						{selectedStudentSubmissions.some(s => s.isFinal) && (
							<div style={{
								marginBottom: 16,
								padding: 12,
								background: '#fffbe6',
								border: '1px solid #ffe58f',
								borderRadius: 6,
								display: 'flex',
								alignItems: 'center',
								gap: 8
							}}>
								<StarFilled style={{ fontSize: 18, color: '#faad14' }} />
								<Text strong style={{ color: '#ad6800' }}>
									Bài nộp có dấu sao vàng là điểm chính thức được dùng để tính điểm cuối cùng
								</Text>
							</div>
						)}

						<Table
							dataSource={selectedStudentSubmissions}
							columns={submissionHistoryColumns}
							rowKey="id"
							bordered
							pagination={false}
							scroll={{ x: 1100 }}
							locale={{ emptyText: "Không có lịch sử nộp bài" }}
							rowClassName={(record) => record.isFinal ? 'final-submission-row' : ''}
						/>

						<style>{`
              .final-submission-row {
                background-color: #fffbe6 !important;
              }
              .final-submission-row:hover > td {
                background-color: #fff7cc !important;
              }
            `}</style>
					</>
				)}
			</Modal>

			{/* 🔥 MODAL XEM CHI TIẾT & CHẤM ĐIỂM */}
			<Modal
				title={
					<div>
						<FileTextOutlined style={{ marginRight: 8 }} />
						Chi tiết bài làm & Chấm điểm
					</div>
				}
				open={submissionDetailModalOpen}
				onCancel={() => {
					setSubmissionDetailModalOpen(false);
					setSubmissionDetail(null);
					setEditingAnswerScore(null);
				}}
				footer={[
					<Button key="close" onClick={() => {
						setSubmissionDetailModalOpen(false);
						setSubmissionDetail(null);
						setEditingAnswerScore(null);
					}}>
						Đóng
					</Button>,
				]}
				width={1400}
				centered
				bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
			>
				{loadingSubmissionDetail ? (
					<div style={{ textAlign: "center", padding: 40 }}>
						<Spin size="large" tip="Đang tải chi tiết bài làm..." />
					</div>
				) : submissionDetail ? (
					<>
						{/* Header thông tin submission */}
						<div style={{ marginBottom: 20, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
							<Row gutter={16}>
								<Col span={6}>
									<Text strong>Bài tập: </Text>
									<Text>{selectedAssignment?.title}</Text>
								</Col>
								<Col span={6}>
									<Text strong>Thời gian nộp: </Text>
									<Text>{dayjs(submissionDetail.submission.submittedAt).format("DD/MM/YYYY HH:mm")}</Text>
								</Col>
								<Col span={6}>
									<Text strong>Điểm: </Text>
									<Tag color={
										submissionDetail.submission.score >= (selectedAssignment?.passingScore || 0)
											? "success"
											: "error"
									}>
										{submissionDetail.submission.score || 0}/{submissionDetail.submission.maxScore}
									</Tag>
								</Col>
								<Col span={6}>
									<Text strong>Trạng thái: </Text>
									<Tag color={submissionDetail.submission.autoGraded ? "blue" : "orange"}>
										{submissionDetail.submission.autoGraded ? "Tự động chấm" : "Thủ công"}
									</Tag>
								</Col>
							</Row>
						</div>

						{/* Danh sách câu trả lời */}
						<Title level={5} style={{ marginBottom: 16 }}>Danh sách câu trả lời</Title>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
							{submissionDetail.answers.map((answer: any, index: number) => {
								const question = answer.question;
								const isEditingThisAnswer = editingAnswerScore?.answerId === answer.id;
								const isReGrading = reGradingCode.has(answer.id);

								return (
									<div
										key={answer.id}
										style={{
											border: '1px solid #d9d9d9',
											borderRadius: 8,
											padding: 16,
											backgroundColor: answer.isCorrect || (answer.score === answer.maxScore)
												? '#f6ffed'
												: '#fff1f0',
										}}
									>
										{/* Question Header */}
										<div style={{ marginBottom: 12 }}>
											<Space style={{ justifyContent: 'space-between', width: '100%' }}>
												<Space>
													<Tag color={answer.isCorrect || (answer.score === answer.maxScore) ? "success" : "error"}>
														Câu {index + 1}
													</Tag>
													{question?.type && <Tag color="blue">{question.type.toUpperCase()}</Tag>}

													{/* 🔥 ĐIỂM CÓ THỂ SỬA */}
													{isEditingThisAnswer ? (
														<Space>
															<Text strong>Điểm: </Text>
															<InputNumber
																min={0}
																max={editingAnswerScore.maxScore}
																value={editingAnswerScore.score}
																onChange={(val) => setEditingAnswerScore({
																	...editingAnswerScore,
																	score: val || 0
																})}
																style={{ width: 80 }}
																size="small"
															/>
															<Text>/ {editingAnswerScore.maxScore}</Text>
															<Button
																type="primary"
																size="small"
																icon={<SaveOutlined />}
																onClick={() => handleUpdateAnswerScore(answer.id, editingAnswerScore.score)}
															>
																Lưu
															</Button>
															<Button
																size="small"
																onClick={() => setEditingAnswerScore(null)}
															>
																Hủy
															</Button>
														</Space>
													) : (
														<Space>
															<Text strong>Điểm: {answer.score}/{answer.maxScore}</Text>
															{/* 🔥 CHỈ CHO ESSAY VÀ CODE ĐƯỢC SỬA ĐIỂM */}
															{(question?.type === "essay" || question?.type === "coding") && (
																<Button
																	type="link"
																	size="small"
																	icon={<EditOutlined />}
																	onClick={() => setEditingAnswerScore({
																		answerId: answer.id,
																		score: answer.score || 0,
																		maxScore: answer.maxScore,
																	})}
																>
																	Sửa điểm
																</Button>
															)}
														</Space>
													)}
												</Space>

												{/* 🔥 NÚT CHẠY LẠI CODE */}
												{question?.type === "coding" && answer.codeAnswer && (
													<Button
														size="small"
														icon={isReGrading ? <ReloadOutlined spin /> : <PlayCircleOutlined />}
														onClick={() => handleReGradeCode(answer.id, question.id)}
														disabled={isReGrading}
														type="primary"
														ghost
													>
														{isReGrading ? "Đang chấm..." : "Chạy lại"}
													</Button>
												)}
											</Space>

											<div style={{ marginTop: 8 }}>
												<Text strong>{question?.content}</Text>
											</div>
										</div>

										<Divider style={{ margin: '12px 0' }} />

										{/* Essay Answer */}
										{question?.type === "essay" && (
											<div>
												<Text strong style={{ display: 'block', marginBottom: 8 }}>
													Câu trả lời của học sinh:
												</Text>
												<div
													style={{
														padding: 12,
														border: '1px solid #d9d9d9',
														borderRadius: 6,
														backgroundColor: '#fff',
														whiteSpace: 'pre-wrap',
														minHeight: 60,
													}}
												>
													{answer.essayAnswer || <Text type="secondary">Không có câu trả lời</Text>}
												</div>
											</div>
										)}

										{/* Coding Answer */}
										{question?.type === "coding" && (
											<div>
												<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
													<Text strong>Code của học sinh:</Text>
													<Tag color="purple">{answer.language || 'N/A'}</Tag>
												</div>
												<pre
													style={{
														padding: 12,
														backgroundColor: '#1e1e1e',
														color: '#4ec9b0',
														borderRadius: 6,
														overflowX: 'auto',
														fontSize: 13,
														fontFamily: "'Fira Code', 'Courier New', monospace",
														margin: 0,
														maxHeight: 300,
													}}
												>
													{answer.codeAnswer || <Text type="secondary">Không có code</Text>}
												</pre>

												{(answer.score !== null || answer.testResults) && (
													<div style={{ marginTop: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
														<div style={{ marginBottom: 8 }}>
															<Text strong>Kết quả test: </Text>
															<Tag color={answer.score === answer.maxScore ? "success" : "warning"}>
																{answer.score ?? 0}/{answer.maxScore ?? 0} điểm
															</Tag>
															<Tag color={answer.judgeStatus === "passed" ? "success" : "error"}>
																{answer.judgeStatus || 'N/A'}
															</Tag>
														</div>

														{/* Test Results */}
														{answer.testResults && answer.testResults.length > 0 && (
															<div style={{ marginTop: 12 }}>
																<Text strong style={{ display: 'block', marginBottom: 8 }}>Test Cases:</Text>
																{answer.testResults.map((test: any, idx: number) => (
																	<div
																		key={idx}
																		style={{
																			padding: 10,
																			marginTop: 8,
																			backgroundColor: test.status === "ok" ? "#f6ffed" : "#fff1f0",
																			border: `1px solid ${test.status === "ok" ? "#b7eb8f" : "#ffa39e"}`,
																			borderRadius: 6,
																		}}
																	>
																		<div style={{ marginBottom: 8 }}>
																			<Text strong>Test Case {idx + 1}: </Text>
																			<Tag color={test.status === "ok" ? "success" : "error"}>
																				{test.status === "ok" ? "✓ Passed" : "✗ Failed"}
																			</Tag>
																		</div>
																		<Row gutter={8}>
																			<Col span={8}>
																				<Text type="secondary" style={{ fontSize: 12 }}>Input:</Text>
																				<pre style={{ fontSize: 12, margin: '4px 0' }}>{test.input}</pre>
																			</Col>
																			<Col span={8}>
																				<Text type="secondary" style={{ fontSize: 12 }}>Expected:</Text>
																				<pre style={{ fontSize: 12, margin: '4px 0' }}>{test.expect}</pre>
																			</Col>
																			<Col span={8}>
																				<Text type="secondary" style={{ fontSize: 12 }}>Got:</Text>
																				<pre style={{
																					fontSize: 12,
																					margin: '4px 0',
																					color: test.status === "ok" ? "#52c41a" : "#ff4d4f"
																				}}>
																					{test.got}
																				</pre>
																			</Col>
																		</Row>
																	</div>
																))}
															</div>
														)}
													</div>
												)}
											</div>
										)}

										{/* Multiple Choice */}
										{question?.type === "multiple_choice" && question.choices && (
											<div>
												<Text strong style={{ display: 'block', marginBottom: 8 }}>
													Lựa chọn của học sinh:
												</Text>
												<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
													{question.choices
														.sort((a: any, b: any) => a.order - b.order)
														.map((choice: any) => {
															const isSelected = answer.selectedChoices?.includes(choice.id);
															const isCorrect = choice.isCorrect;
															let bgColor = "#fff";
															let borderColor = "#d9d9d9";

															if (isCorrect) {
																bgColor = "#f6ffed";
																borderColor = "#52c41a";
															}
															if (isSelected && !isCorrect) {
																bgColor = "#fff1f0";
																borderColor = "#ff4d4f";
															}

															return (
																<div
																	key={choice.id}
																	style={{
																		padding: '10px 12px',
																		border: `1px solid ${borderColor}`,
																		borderRadius: 6,
																		backgroundColor: bgColor,
																		display: 'flex',
																		alignItems: 'center',
																		gap: 8,
																	}}
																>
																	<span style={{ flex: 1 }}>{choice.content}</span>
																	{isCorrect && <Tag color="success" style={{ margin: 0 }}>Đáp án đúng</Tag>}
																	{isSelected && <Tag color="blue" style={{ margin: 0 }}>Đã chọn</Tag>}
																</div>
															);
														})}
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</>
				) : (
					<div style={{ textAlign: "center", padding: 40 }}>
						<Text type="secondary">Không có dữ liệu</Text>
					</div>
				)}
			</Modal>
		</div>
	);
}