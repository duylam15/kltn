import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	Tag,
	Modal,
	Input,
	Tooltip,
	Form,
	Popconfirm,
	InputNumber,
	Space,
	Divider,
	Checkbox,
	Card,
	Select,
	Row,
	Col,
	Radio,
	Switch,
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	QuestionCircleOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	BookOutlined,
	FileTextOutlined,
	CodeOutlined,
	FormOutlined,
	UnorderedListOutlined,
	FolderOpenOutlined,
	GlobalOutlined,
	LockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { BookOpen } from "lucide-react";
import { useAuth } from "../../context/authContext";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

enum ProgrammingLanguage {
	javascript = "javascript",
	python = "python",
	java = "java",
	cpp = "cpp",
	csharp = "csharp",
	php = "php",
	html = "html",
	css = "css",
}

const ProgrammingLanguageLabels: Record<ProgrammingLanguage, string> = {
	[ProgrammingLanguage.javascript]: "JavaScript",
	[ProgrammingLanguage.python]: "Python",
	[ProgrammingLanguage.java]: "Java",
	[ProgrammingLanguage.cpp]: "C++",
	[ProgrammingLanguage.csharp]: "C#",
	[ProgrammingLanguage.php]: "PHP",
	[ProgrammingLanguage.html]: "HTML",
	[ProgrammingLanguage.css]: "CSS",
};

type Choice = {
	id?: number;
	content: string;
	isCorrect: boolean;
	order?: number;
};

type TestCase = {
	id?: number;
	questionId?: number;
	input: string;
	expectedOutput: string;
	isHidden: boolean;
	points: number;
	order: number;
};

type Subject = {
	id: number;
	subjectCode: string;
	subjectName: string;
};

type Chapter = {
	id: number;
	subjectId: number;
	chapterCode: string;
	chapterName: string;
	order: number;
};

type Question = {
	id: number;
	type: string;
	content: string;
	points: number;
	difficulty: "easy" | "medium" | "hard";
	subjectId?: number;
	chapterId?: number;
	tags?: string;
	language?: ProgrammingLanguage;
	choices?: Choice[];
	subject?: Subject;
	chapter?: Chapter;
	createdAt?: string;
	updatedAt?: string;
	isPublic?: boolean;
};

export default function QuestionsTeacher() {
	const [loading, setLoading] = useState(true);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [keyword, setKeyword] = useState("");

	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [allChapters, setAllChapters] = useState<Chapter[]>([]);

	const [filterSubject, setFilterSubject] = useState<number | null>(null);
	const [filterChapter, setFilterChapter] = useState<number | null>(null);
	const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
	const [filterType, setFilterType] = useState<string | null>(null);

	const [form] = Form.useForm<any>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Question | null>(null);
	const [choices, setChoices] = useState<Choice[]>([
		{ content: "", isCorrect: false, order: 1 },
	]);
	const [testCases, setTestCases] = useState<TestCase[]>([]);
	const [questionType, setQuestionType] = useState<string>("multiple_choice");

	const [formChapters, setFormChapters] = useState<Chapter[]>([]);
	const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
	const [detailTestCases, setDetailTestCases] = useState<TestCase[]>([]);

	const { user } = useAuth();
	const userId = user?.id;

	useEffect(() => {
		if (userId) {
			fetchQuestions();
			fetchSubjects();
		}
	}, [userId]);

	async function fetchQuestions() {
		if (!userId) {
			toast.error("Không tìm thấy thông tin người dùng");
			return;
		}

		try {
			setLoading(true);
			const res = await instance.get<{ success: boolean; data: Question[] }>(
				`/questions/user/${userId}`
			);
			if (res.data.success) {
				setQuestions(res.data.data || []);
			}
		} catch (err: any) {
			const errorMsg = err?.response?.data?.message || "Không tải được danh sách câu hỏi";
			toast.error(errorMsg);
		} finally {
			setLoading(false);
		}
	}

	async function fetchSubjects() {
		try {
			const res = await instance.get<{ success: boolean; data: Subject[] }>(
				`/subjects`
			);
			if (res.data.success) {
				setSubjects(res.data.data || []);

				const chaptersPromises = res.data.data.map((subject) =>
					instance.get<{ success: boolean; data: { items: Chapter[] } }>(
						`/chapters?  subject_id=${subject.id}`
					)
				);

				const chaptersResults = await Promise.all(chaptersPromises);
				const allChaps = chaptersResults.flatMap((res) =>
					res.data.success ? res.data.data.items || [] : []
				);
				setAllChapters(allChaps);
			}
		} catch (err) {
			console.error("Không tải được danh sách môn học");
		}
	}

	async function fetchChaptersBySubject(subjectId: number) {
		try {
			const res = await instance.get<{ success: boolean; data: Chapter[] }>(
				`/chapters?  subject_id=${subjectId}`
			);
			if (res.data.success) {
				return res.data.data || [];
			}
			return [];
		} catch (err) {
			console.error("Không tải được danh sách chương");
			return [];
		}
	}

	async function fetchTestCases(questionId: number) {
		try {
			const res = await instance.get<{ success: boolean; data: TestCase[] }>(
				`/test-cases/question/${questionId}`
			);
			if (res.data.success) {
				return res.data.data || [];
			}
			return [];
		} catch (err) {
			console.error("Không tải được danh sách test case");
			return [];
		}
	}

	const handleSubjectChange = async (subjectId: number | null) => {
		setSelectedSubjectId(subjectId);
		form.setFieldValue("chapterId", null);

		if (subjectId) {
			const chaps = await fetchChaptersBySubject(subjectId);
			setFormChapters(chaps);
		} else {
			setFormChapters([]);
		}
	};

	const handleFilterSubjectChange = async (subjectId: number | null) => {
		setFilterSubject(subjectId);
		setFilterChapter(null);

		if (subjectId) {
			const chaps = await fetchChaptersBySubject(subjectId);
			setChapters(chaps);
		} else {
			setChapters([]);
		}
	};

	const handleQuestionTypeChange = (type: string) => {
		setQuestionType(type);

		if (type === "multiple_choice") {
			setChoices([{ content: "", isCorrect: false, order: 1 }]);
			setTestCases([]);
			form.setFieldValue("language", undefined);
		} else if (type === "essay") {
			setChoices([]);
			setTestCases([]);
			form.setFieldValue("language", undefined);
		} else if (type === "coding") {
			setChoices([]);
			setTestCases([]);
		}
	};

	const handleDelete = async (id: number) => {
		try {
			await instance.delete(`/questions/${id}`);
			toast.success("Đã xóa câu hỏi");
			setQuestions((prev) => prev.filter((q) => q.id !== id));
		} catch (err) {
			toast.error("Không thể xóa câu hỏi");
		}
	};

	const handleChoicesUpdate = async (questionId: number, newChoices: Choice[]) => {
		try {
			const existingChoices = editing?.choices || [];
			const existingMap = new Map(existingChoices.map((c) => [c.id, c]));
			const newMap = new Map(newChoices.filter((c) => c.id).map((c) => [c.id, c]));

			for (const existingChoice of existingChoices) {
				if (existingChoice.id && !newMap.has(existingChoice.id)) {
					await instance.delete(`/questions-choices/choices/${existingChoice.id}`);
				}
			}

			for (const choice of newChoices) {
				if (choice.id) {
					await instance.put(`/questions-choices/choices/${choice.id}`, {
						content: choice.content.trim(),
						isCorrect: choice.isCorrect,
						order: choice.order,
					});
				} else {
					await instance.post(`/questions-choices/${questionId}/choices`, {
						questionId,
						content: choice.content.trim(),
						isCorrect: choice.isCorrect,
						order: choice.order,
					});
				}
			}

			toast.success("Đã cập nhật đáp án");
		} catch (err: any) {
			console.error("Error updating choices:", err.response?.data);
			toast.error("Lỗi khi cập nhật đáp án");
			throw err;
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			const payload: any = {
				type: values.type || "multiple_choice",
				content: values.content.trim(),
				points: values.points ? Number(values.points) : 5,
				subjectId: values.subjectId ? Number(values.subjectId) : undefined,
				chapterId: values.chapterId ? Number(values.chapterId) : undefined,
				tags: values.tags?.trim() || undefined,
				difficulty: values.difficulty || "medium",
				createdBy: userId,
				language: values.type === "coding" ? values.language : undefined,
				isPublic: Boolean(values.isPublic),
			};

			if (values.type === "multiple_choice") {
				if (choices.length < 2) {
					toast.error("Cần ít nhất 2 đáp án");
					return;
				}

				const hasCorrectAnswer = choices.some((c) => c.isCorrect);
				if (!hasCorrectAnswer) {
					toast.error("Cần ít nhất 1 đáp án đúng");
					return;
				}

				const validChoices = choices.filter((c) => c.content.trim());
				if (validChoices.length < 2) {
					toast.error("Cần ít nhất 2 đáp án có nội dung");
					return;
				}
			}

			let questionId: number;

			if (editing) {
				await instance.put(`/questions/${editing.id}`, payload);
				questionId = editing.id;
				toast.success("Đã cập nhật câu hỏi");
			} else {
				const res = await instance.post(`/questions`, payload);
				questionId = res.data.data.id;
				toast.success("Đã thêm câu hỏi mới");
			}

			if (values.type === "multiple_choice") {
				const validChoices = choices
					.filter((c) => c.content.trim())
					.map((c, idx) => ({
						id: c.id,
						content: c.content.trim(),
						isCorrect: c.isCorrect,
						order: idx + 1,
					}));

				await handleChoicesUpdate(questionId, validChoices);
			}

			if (values.type === "coding" && testCases.length > 0) {
				try {
					if (editing) {
						const existingTestCases = await fetchTestCases(questionId);
						for (const tc of existingTestCases) {
							await instance.delete(`/test-cases/${tc.id}`);
						}
					}

					for (const tc of testCases) {
						await instance.post(`/test-cases`, {
							questionId,
							input: tc.input,
							expectedOutput: tc.expectedOutput,
							isHidden: tc.isHidden,
							points: tc.points,
							order: tc.order,
						});
					}
					toast.success("Đã lưu test cases");
				} catch (err: any) {
					console.log("Backend error:", err.response?.data);
					toast.error("Lỗi khi lưu test cases");
				}
			}

			setModalOpen(false);
			setEditing(null);
			form.resetFields();
			setChoices([{ content: "", isCorrect: false, order: 1 }]);
			setTestCases([]);
			setQuestionType("multiple_choice");
			setSelectedSubjectId(null);
			setFormChapters([]);
			fetchQuestions();
		} catch (err: any) {
			console.log("Backend error:", err.response?.data);
			if (err?.errorFields) return;
			const errorMsg = err?.response?.data?.message || "Không thể lưu câu hỏi";
			toast.error(errorMsg);
		}
	};

	const addChoice = () => {
		setChoices([
			...choices,
			{ content: "", isCorrect: false, order: choices.length + 1 },
		]);
	};

	const removeChoice = (index: number) => {
		if (choices.length <= 2) {
			toast.error("Cần ít nhất 2 đáp án");
			return;
		}
		setChoices(choices.filter((_, i) => i !== index));
	};

	const updateChoice = (index: number, field: keyof Choice, value: any) => {
		const newChoices = [...choices];
		newChoices[index] = { ...newChoices[index], [field]: value };
		setChoices(newChoices);
	};

	const addTestCase = () => {
		setTestCases([
			...testCases,
			{
				input: "",
				expectedOutput: "",
				isHidden: false,
				points: 1,
				order: testCases.length + 1,
			},
		]);
	};

	const removeTestCase = (index: number) => {
		setTestCases(testCases.filter((_, i) => i !== index));
	};

	const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
		const newTestCases = [...testCases];
		newTestCases[index] = { ...newTestCases[index], [field]: value };
		setTestCases(newTestCases);
	};

	const viewDetails = async (record: Question) => {
		setSelectedQuestion(record);

		if (record.type === "coding") {
			const testCasesData = await fetchTestCases(record.id);
			setDetailTestCases(testCasesData);
		} else {
			setDetailTestCases([]);
		}

		setDetailModalOpen(true);
	};

	const renderTypeTag = (type: string) => {
		const config = {
			multiple_choice: { color: "blue", text: "Trắc nghiệm", icon: <UnorderedListOutlined /> },
			essay: { color: "green", text: "Tự luận", icon: <FormOutlined /> },
			coding: { color: "purple", text: "Code", icon: <CodeOutlined /> },
		};
		const typeConfig = config[type as keyof typeof config] || {
			color: "default",
			text: type,
			icon: null,
		};
		return (
			<Tag color={typeConfig.color} icon={typeConfig.icon}>
				{typeConfig.text}
			</Tag>
		);
	};

	const renderDifficultyTag = (difficulty: string) => {
		const config = {
			easy: { color: "green", text: "Dễ" },
			medium: { color: "orange", text: "Trung bình" },
			hard: { color: "red", text: "Khó" },
		};
		const diff = config[difficulty as keyof typeof config] || {
			color: "default",
			text: difficulty,
		};
		return <Tag color={diff.color}>{diff.text}</Tag>;
	};

	const toggleIsPublic = async (questionId: number, current: boolean | undefined) => {
		try {
			const newValue = !current;
			await instance.put(`/questions/${questionId}`, { isPublic: newValue });
			setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, isPublic: newValue } : q)));
			toast.success(newValue ? "Đã bật chế độ công khai" : "Đã tắt chế độ công khai");
		} catch (err: any) {
			console.error("Error toggling isPublic:", err.response?.data || err);
			const msg = err?.response?.data?.message || "Lỗi khi thay đổi trạng thái công khai";
			toast.error(msg);
		}
	};

	const columns = [
		{
			title: "Nội dung câu hỏi",
			dataIndex: "content",
			key: "content",
			width: 250,
			fixed: "left" as const,
			render: (text: string, record: Question) => (
				<div>
					<Text strong style={{ cursor: "pointer", fontSize: 14 }} onClick={() => viewDetails(record)}>
						{text.length > 60 ? text.substring(0, 60) + "..." : text}
					</Text>
				</div>
			),
		},
		{
			title: "Loại",
			dataIndex: "type",
			key: "type",
			width: 110,
			align: "center" as const,
			render: renderTypeTag,
		},
		{
			title: "Môn học",
			key: "subject",
			width: 140,
			render: (_: any, record: Question) =>
				record.subject ? (
					<div>
						<Tag color="blue" icon={<BookOutlined />} style={{ fontSize: 11 }}>
							{record.subject.subjectCode}
						</Tag>
						<div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
							{record.subject.subjectName.length > 15
								? record.subject.subjectName.substring(0, 15) + "..."
								: record.subject.subjectName}
						</div>
					</div>
				) : (
					<Text type="secondary">—</Text>
				),
		},
		{
			title: "Chương",
			key: "chapter",
			width: 100,
			render: (_: any, record: Question) =>
				record.chapter ? (
					<Tooltip title={record.chapter.chapterName}>
						<Tag color="purple" icon={<FileTextOutlined />} style={{ fontSize: 11 }}>
							{record.chapter.chapterCode}
						</Tag>
					</Tooltip>
				) : (
					<Text type="secondary">—</Text>
				),
		},
		{
			title: "Độ khó",
			dataIndex: "difficulty",
			key: "difficulty",
			width: 100,
			align: "center" as const,
			render: renderDifficultyTag,
		},
		{
			title: "Điểm",
			dataIndex: "points",
			key: "points",
			width: 80,
			align: "center" as const,
			sorter: (a: Question, b: Question) => a.points - b.points,
			render: (points: number) => <Tag color="green">{points}</Tag>,
		},
		{
			title: "Công khai",
			key: "isPublic",
			width: 110,
			align: "center" as const,
			render: (_: any, record: Question) => (
				<Switch
					checked={Boolean(record.isPublic)}
					onChange={() => toggleIsPublic(record.id, record.isPublic)}
					size="small"
					checkedChildren={<GlobalOutlined />}
					unCheckedChildren={<LockOutlined />}
				/>
			),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 150,
			align: "center" as const,
			render: (_: any, record: Question) => (
				<Space size="small">
					<Tooltip title="Xem chi tiết">
						<Button
							icon={<QuestionCircleOutlined />}
							size="small"
							onClick={() => viewDetails(record)}
						/>
					</Tooltip>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={async () => {
								setEditing(record);
								setQuestionType(record.type);
								form.setFieldsValue({
									type: record.type,
									content: record.content,
									points: record.points,
									difficulty: record.difficulty,
									subjectId: record.subjectId,
									chapterId: record.chapterId,
									tags: record.tags,
									language: record.language,
									isPublic: record.isPublic,
								});

								if (record.subjectId) {
									const chaps = await fetchChaptersBySubject(record.subjectId);
									setFormChapters(chaps);
									setSelectedSubjectId(record.subjectId);
								}

								if (record.type === "multiple_choice") {
									setChoices(
										record.choices && record.choices.length > 0
											? record.choices.map((c) => ({
												id: c.id,
												content: c.content,
												isCorrect: c.isCorrect,
												order: c.order,
											}))
											: [{ content: "", isCorrect: false, order: 1 }]
									);
									setTestCases([]);
								} else if (record.type === "coding") {
									const testCasesData = await fetchTestCases(record.id);
									setTestCases(testCasesData);
									setChoices([]);
								} else {
									setChoices([]);
									setTestCases([]);
								}

								setModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa câu hỏi"
							description="Bạn có chắc muốn xóa?"
							okText="Xóa"
							cancelText="Hủy"
							okButtonProps={{ danger: true }}
							onConfirm={() => handleDelete(record.id)}
						>
							<Button danger size="small" icon={<DeleteOutlined />} />
						</Popconfirm>
					</Tooltip>
				</Space>
			),
		},
	];

	const filteredQuestions = questions.filter((q) => {
		if (keyword) {
			const kw = keyword.toLowerCase();
			const matchContent = q.content?.toLowerCase().includes(kw);
			const matchSubject =
				q.subject?.subjectName?.toLowerCase().includes(kw) ||
				q.subject?.subjectCode?.toLowerCase().includes(kw);
			const matchChapter =
				q.chapter?.chapterName?.toLowerCase().includes(kw) ||
				q.chapter?.chapterCode?.toLowerCase().includes(kw);

			if (!matchContent && !matchSubject && !matchChapter) return false;
		}

		if (filterSubject && q.subjectId !== filterSubject) return false;
		if (filterChapter && q.chapterId !== filterChapter) return false;
		if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
		if (filterType && q.type !== filterType) return false;

		return true;
	});

	const handleReload = async () => {
		setKeyword("");
		setFilterSubject(null);
		setFilterChapter(null);
		setFilterDifficulty(null);
		setFilterType(null);
		await fetchQuestions();
	};

	const getStatistics = () => {
		const totalQuestions = questions.length;
		const publicQuestions = questions.filter((q) => q.isPublic).length;
		const privateQuestions = totalQuestions - publicQuestions;
		const multipleChoice = questions.filter((q) => q.type === "multiple_choice").length;

		return {
			totalQuestions,
			publicQuestions,
			privateQuestions,
			multipleChoice,
		};
	};

	const stats = getStatistics();

	if (!userId) {
		return (
			<div style={{ textAlign: "center", padding: 60 }}>
				<Spin size="large" />
				<div style={{ marginTop: 16 }}>
					<Text type="secondary">Đang tải thông tin người dùng...</Text>
				</div>
			</div>
		);
	}

	return (
		<div className="questions-container" style={{ padding: "8px 12px" }}>
			<style>
				{`
					@media (max-width: 768px) {
						.questions-title {
							font-size: 18px ! important;
							margin-bottom: 0 !important;
						}

						.stats-container {
							display: none !important;
						}

						.header-actions {
							flex-direction: column !important;
							gap: 8px !important;
							width: 100%;
							padding-top: 8px !important;
						}

						.header-actions > div {
							width: 100% ! important;
						}

						.header-actions . ant-btn {
							width: 100% !important;
						}

						.hide-on-mobile {
							display: none !important;
						}


						.filter-card {
							padding: 8px !important;
						}

						.filter-card .ant-row {
							gap: 8px;
						}

						.filter-card .ant-col {
							flex: 0 0 100% !important;
							max-width: 100% ! important;
						}

						.ant-modal {
							max-width: calc(100vw - 16px) !important;
							margin: 8px ! important;
						}
						
						.ant-table-wrapper::after {
							content: "← Vuốt để xem thêm →";
							display: block;
							text-align: center;
							font-size: 11px;
							color: #999;
							padding: 8px 0 4px;
							font-style: italic;
						}
					}

					@media (min-width: 769px) and (max-width: 1024px) {
						.stats-container > div:nth-child(n+4) {
							display: none ! important;
						}
					}

					@media (min-width: 1025px) {
						.questions-container {
							padding: 16px !important;
						}
					}
					
					.ant-table-body::-webkit-scrollbar {
						height: 8px;
					}
					
					. ant-table-body::-webkit-scrollbar-track {
						background: #f1f1f1;
						border-radius: 4px;
					}
					
					. ant-table-body::-webkit-scrollbar-thumb {
						background: #888;
						border-radius: 4px;
					}
					
					.ant-table-body::-webkit-scrollbar-thumb:hover {
						background: #555;
					}
				`}
			</style>

			{/* Header */}
			<Title level={3} className="questions-title" style={{ margin: 0, marginBottom: 16 }}>
				<div className="flex items-center gap-2">
					<BookOpen size={20} /> Câu hỏi của tôi
				</div>
			</Title>

			{/* Header Wrapper */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: 16,
					flexWrap: "wrap",
					gap: 12,
				}}
			>
				{/* Statistics Badges */}
				<div
					className="stats-container hide-on-mobile"
					style={{
						display: "flex",
						gap: 8,
						flexWrap: "wrap",
						flex: "1 1 auto",
					}}
				>
					{/* Tổng câu hỏi */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: 12,
							color: "#000",
							border: "1px solid #ddd",
							borderRadius: 6,
							padding: "6px 10px",
							background: "#fff",
							whiteSpace: "nowrap",
						}}
					>
						<FolderOpenOutlined style={{ fontSize: 14, color: "#1890ff" }} />
						<span>Tổng câu hỏi:</span>
						<strong>{stats.totalQuestions}</strong>
					</div>
				</div>

				{/* FILTERS + ACTIONS (giống Material) */}
				<div
					className="header-actions"
					style={{
						display: "flex",
						gap: 8,
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					{/* Search */}
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm câu hỏi..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 200 }}
					/>

					{/* Filter Loại */}
					<Select
						allowClear
						placeholder="Loại"
						style={{ width: 100 }}
						value={filterType}
						onChange={setFilterType}
					>
						<Option value="multiple_choice">Trắc nghiệm</Option>
						<Option value="essay">Tự luận</Option>
						<Option value="coding">Lập trình</Option>
					</Select>

					{/* Filter Môn */}
					<Select
						allowClear
						placeholder="Môn học"
						style={{ width: 100 }}
						value={filterSubject}
						onChange={handleFilterSubjectChange}
					>
						{subjects.map((s) => (
							<Option key={s.id} value={s.id}>
								{s.subjectCode}
							</Option>
						))}
					</Select>

					{/* Filter Chương */}
					<Select
						allowClear
						placeholder="Chương"
						style={{ width: 100 }}
						value={filterChapter}
						onChange={setFilterChapter}
						disabled={!filterSubject}
					>
						{chapters.map((c) => (
							<Option key={c.id} value={c.id}>
								{c.chapterCode}
							</Option>
						))}
					</Select>

					{/* Filter Độ khó */}
					<Select
						allowClear
						placeholder="Độ khó"
						style={{ width: 100 }}
						value={filterDifficulty}
						onChange={setFilterDifficulty}
					>
						<Option value="easy">Dễ</Option>
						<Option value="medium">Trung bình</Option>
						<Option value="hard">Khó</Option>
					</Select>

					{/* Action Buttons */}
					<Button icon={<ReloadOutlined />} onClick={handleReload}>
						<span className="btn-text">Làm mới</span>
					</Button>

					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setEditing(null);
							form.resetFields();
							form.setFieldsValue({
								type: "multiple_choice",
								points: 1,
								difficulty: "easy",
								isPublic: false,
							});
							setChoices([{ content: "", isCorrect: false, order: 1 }]);
							setTestCases([]);
							setQuestionType("multiple_choice");
							setSelectedSubjectId(null);
							setFormChapters([]);
							setModalOpen(true);
						}}
					>
						<span className="btn-text">Thêm</span>
					</Button>
				</div>
			</div>



			{/* Table */}
			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách câu hỏi..." />
				</div>
			) : (
				<div style={{ overflowX: "auto" }}>
					<Table<Question>
						dataSource={filteredQuestions}
						columns={columns}
						rowKey="id"
						bordered
						pagination={{
							pageSize: 10,
							showSizeChanger: true,
							showTotal: (total) => `Tổng ${total} câu hỏi`,
							responsive: true,
						}}
						scroll={{ x: 1050 }}
						size="middle"
						locale={{ emptyText: "Chưa có câu hỏi nào" }}
					/>
				</div>
			)}

			{/* Modals giữ nguyên code cũ của bạn với thêm maxWidth responsive */}
			<Modal
				title={
					<Space>
						<QuestionCircleOutlined />
						{editing ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
					</Space>
				}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					setChoices([{ content: "", isCorrect: false, order: 1 }]);
					setTestCases([]);
					setQuestionType("multiple_choice");
					setSelectedSubjectId(null);
					setFormChapters([]);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu thay đổi" : "Tạo mới"}
				cancelText="Hủy"
				width={900}
				style={{ maxWidth: "calc(100vw - 16px)" }}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Form
					form={form}
					layout="vertical"
					style={{ marginTop: 16 }}
				>
					{/* Question Type Selection */}
					<Form.Item
						label="Loại câu hỏi"
						name="type"
						rules={[{ required: true, message: "Vui lòng chọn loại câu hỏi" }]}
						initialValue="multiple_choice"
					>
						<Radio.Group
							onChange={(e) => handleQuestionTypeChange(e.target.value)}
							value={questionType}
						>
							<Radio.Button value="multiple_choice">
								<UnorderedListOutlined /> Trắc nghiệm
							</Radio.Button>
							<Radio.Button value="essay">
								<FormOutlined /> Tự luận
							</Radio.Button>
							<Radio.Button value="coding">
								<CodeOutlined /> Code
							</Radio.Button>
						</Radio.Group>
					</Form.Item>

					{/* Language Selection */}
					{questionType === "coding" && (
						<Form.Item
							label="Ngôn ngữ lập trình"
							name="language"
							rules={[{ required: true, message: "Vui lòng chọn ngôn ngữ lập trình" }]}
						>
							<Select placeholder="Chọn ngôn ngữ lập trình">
								{Object.values(ProgrammingLanguage).map((lang) => (
									<Option key={lang} value={lang}>
										<Tag color="cyan">
											{ProgrammingLanguageLabels[lang]}
										</Tag>
									</Option>
								))}
							</Select>
						</Form.Item>
					)}

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Môn học"
								name="subjectId"
								rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
							>
								<Select
									showSearch
									allowClear
									placeholder="Chọn môn học"
									onChange={handleSubjectChange}
									filterOption={(input, option) =>
										String(option?.children || "")
											?.toLowerCase()
											.includes(input.toLowerCase())
									}
								>
									{subjects.map((s) => (
										<Option key={s.id} value={s.id}>
											{s.subjectCode} - {s.subjectName}
										</Option>
									))}
								</Select>
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="Chương" name="chapterId">
								<Select
									showSearch
									allowClear
									placeholder="Chọn chương (không bắt buộc)"
									disabled={!selectedSubjectId}
									filterOption={(input, option) =>
										String(option?.children || "")
											?.toLowerCase()
											.includes(input.toLowerCase())
									}
								>
									{formChapters.map((c) => (
										<Option key={c.id} value={c.id}>
											{c.chapterCode} - {c.chapterName}
										</Option>
									))}
								</Select>
							</Form.Item>
						</Col>
					</Row>

					<Form.Item
						label="Nội dung câu hỏi"
						name="content"
						rules={[{ required: true, message: "Vui lòng nhập nội dung câu hỏi" }]}
					>
						<TextArea
							placeholder="Nhập nội dung câu hỏi..."
							rows={4}
							maxLength={1000}
							showCount
						/>
					</Form.Item>

					<Row gutter={16}>
						<Col span={8}>
							<Form.Item
								label="Điểm"
								name="points"
								rules={[{ required: true, message: "Vui lòng nhập điểm" }]}
								initialValue={1}
							>
								<InputNumber
									min={1}
									max={100}
									style={{ width: "100%" }}
									placeholder="Nhập điểm"
								/>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item
								label="Độ khó"
								name="difficulty"
								rules={[{ required: true, message: "Vui lòng chọn độ khó" }]}
								initialValue="easy"
							>
								<Select placeholder="Chọn độ khó">
									<Option value="easy">
										<Tag color="green">Dễ</Tag>
									</Option>
									<Option value="medium">
										<Tag color="orange">Trung bình</Tag>
									</Option>
									<Option value="hard">
										<Tag color="red">Khó</Tag>
									</Option>
								</Select>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item label="Tags (phân cách bởi dấu phẩy)" name="tags">
								<Input placeholder="VD: loop, array, basic" />
							</Form.Item>
						</Col>
					</Row>

					{/* 🆕 Public checkbox */}
					<Form.Item name="isPublic" valuePropName="checked">
						<Checkbox>
							<Text>Cho phép chia sẻ công khai (Giáo viên khác có thể thêm câu hỏi này vào bài tập của họ)</Text>
						</Checkbox>
					</Form.Item>

					{/* Multiple Choice Answers */}
					{questionType === "multiple_choice" && (
						<>
							<Divider>Đáp án</Divider>

							{choices.map((choice, index) => (
								<Card
									key={index}
									size="small"
									style={{ marginBottom: 12 }}
									extra={
										choices.length > 2 && (
											<Button
												type="text"
												danger
												size="small"
												icon={<DeleteOutlined />}
												onClick={() => removeChoice(index)}
											>
												Xóa
											</Button>
										)
									}
								>
									<Space direction="vertical" style={{ width: "100%" }}>
										<Input
											placeholder={`Nội dung đáp án ${index + 1}`}
											value={choice.content}
											onChange={(e) =>
												updateChoice(index, "content", e.target.value)
											}
											maxLength={200}
										/>
										<Checkbox
											checked={choice.isCorrect}
											onChange={(e) =>
												updateChoice(index, "isCorrect", e.target.checked)
											}
										>
											<Text type={choice.isCorrect ? "success" : "secondary"}>
												{choice.isCorrect ? "✓ Đáp án đúng" : "Đáp án sai"}
											</Text>
										</Checkbox>
									</Space>
								</Card>
							))}

							<Button
								type="dashed"
								icon={<PlusOutlined />}
								onClick={addChoice}
								block
								style={{ marginTop: 8 }}
							>
								Thêm đáp án
							</Button>
						</>
					)}

					{/* Code Test Cases */}
					{questionType === "coding" && (
						<>
							<Divider>Test Cases</Divider>

							{testCases.map((testCase, index) => (
								<Card
									key={index}
									size="small"
									style={{ marginBottom: 12 }}
									title={`Test Case ${index + 1}`}
									extra={
										<Button
											type="text"
											danger
											size="small"
											icon={<DeleteOutlined />}
											onClick={() => removeTestCase(index)}
										>
											Xóa
										</Button>
									}
								>
									<Row gutter={16}>
										<Col span={12}>
											<Text strong>Input:</Text>
											<TextArea
												placeholder="Nhập input"
												value={testCase.input}
												onChange={(e) =>
													updateTestCase(index, "input", e.target.value)
												}
												rows={3}
												style={{ marginTop: 4 }}
											/>
										</Col>
										<Col span={12}>
											<Text strong>Expected Output:</Text>
											<TextArea
												placeholder="Nhập expected output"
												value={testCase.expectedOutput}
												onChange={(e) =>
													updateTestCase(
														index,
														"expectedOutput",
														e.target.value
													)
												}
												rows={3}
												style={{ marginTop: 4 }}
											/>
										</Col>
									</Row>
									<Row gutter={16} style={{ marginTop: 12 }}>
										<Col span={8}>
											<Text strong>Điểm:</Text>
											<InputNumber
												min={1}
												max={100}
												value={testCase.points}
												onChange={(value) =>
													updateTestCase(index, "points", value || 1)
												}
												style={{ width: "100%", marginTop: 4 }}
											/>
										</Col>
										<Col span={8}>
											<Text strong>Thứ tự:</Text>
											<InputNumber
												min={1}
												value={testCase.order}
												onChange={(value) =>
													updateTestCase(index, "order", value || index + 1)
												}
												style={{ width: "100%", marginTop: 4 }}
											/>
										</Col>
										<Col span={8}>
											<div style={{ marginTop: 24 }}>
												<Checkbox
													checked={testCase.isHidden}
													onChange={(e) =>
														updateTestCase(index, "isHidden", e.target.checked)
													}
												>
													Ẩn test case
												</Checkbox>
											</div>
										</Col>
									</Row>
								</Card>
							))}

							<Button
								type="dashed"
								icon={<PlusOutlined />}
								onClick={addTestCase}
								block
								style={{ marginTop: 8 }}
							>
								Thêm Test Case
							</Button>
						</>
					)}

					{/* Essay */}
					{questionType === "essay" && (
						<Card size="small" style={{ backgroundColor: "#f0f5ff" }}>
							<Text type="secondary">
								Câu hỏi tự luận không cần thêm đáp án hoặc test case. Sinh viên sẽ
								nhập câu trả lời tự do.
							</Text>
						</Card>
					)}
				</Form>			</Modal>

			{/* Detail Modal giữ nguyên với maxWidth responsive */}
			<Modal
				title={
					<Space>
						<QuestionCircleOutlined />
						<span>Chi tiết câu hỏi</span>
					</Space>
				}
				open={detailModalOpen}
				onCancel={() => {
					setDetailModalOpen(false);
					setSelectedQuestion(null);
					setDetailTestCases([]);
				}}
				footer={[
					<Button key="close" onClick={() => setDetailModalOpen(false)}>
						Đóng
					</Button>,
				]}
				width={800}
				style={{ maxWidth: "calc(100vw - 16px)" }}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				{selectedQuestion && (
					<div>
						{(selectedQuestion.subject || selectedQuestion.chapter) && (
							<Card
								size="small"
								style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
							>
								<Row gutter={16}>
									{selectedQuestion.subject && (
										<Col span={12}>
											<Text strong>Môn học:</Text>
											<div style={{ marginTop: 4 }}>
												<Tag color="blue" icon={<BookOutlined />}>
													{selectedQuestion.subject.subjectCode}
												</Tag>
												<div style={{ fontSize: 12, marginTop: 4 }}>
													{selectedQuestion.subject.subjectName}
												</div>
											</div>
										</Col>
									)}
									{selectedQuestion.chapter && (
										<Col span={12}>
											<Text strong>Chương:</Text>
											<div style={{ marginTop: 4 }}>
												<Tag color="purple" icon={<FileTextOutlined />}>
													{selectedQuestion.chapter.chapterCode}
												</Tag>
												<div style={{ fontSize: 12, marginTop: 4 }}>
													{selectedQuestion.chapter.chapterName}
												</div>
											</div>
										</Col>
									)}
								</Row>
							</Card>
						)}

						<div style={{ marginBottom: 16 }}>
							<Text strong>Nội dung câu hỏi:</Text>
							<div
								style={{
									marginTop: 8,
									padding: 12,
									backgroundColor: "#fafafa",
									borderRadius: 4,
								}}
							>
								<Text>{selectedQuestion.content}</Text>
							</div>
						</div>

						<Row gutter={16} style={{ marginBottom: 16 }}>
							<Col span={6}>
								<Text strong>Loại:</Text> {renderTypeTag(selectedQuestion.type)}
							</Col>
							{selectedQuestion.type === "coding" && selectedQuestion.language && (
								<Col span={6}>
									<Text strong>Ngôn ngữ:</Text>{" "}
									<Tag color="cyan">
										{ProgrammingLanguageLabels[selectedQuestion.language]}
									</Tag>
								</Col>
							)}
							<Col span={6}>
								<Text strong>Độ khó:</Text>{" "}
								{renderDifficultyTag(selectedQuestion.difficulty)}
							</Col>
							<Col span={6}>
								<Text strong>Điểm:</Text>{" "}
								<Tag color="green">{selectedQuestion.points} điểm</Tag>
							</Col>
						</Row>

						{selectedQuestion.tags && (
							<div style={{ marginBottom: 16 }}>
								<Text strong>Tags:</Text>
								<div style={{ marginTop: 8 }}>
									{selectedQuestion.tags.split(",").map((tag, idx) => (
										<Tag key={idx} color="cyan">
											{tag.trim()}
										</Tag>
									))}
								</div>
							</div>
						)}

						{/* Show Public status in details */}
						<div style={{ marginBottom: 16 }}>
							<Text strong>Trạng thái chia sẻ:</Text>
							<div style={{ marginTop: 8 }}>
								{selectedQuestion.isPublic ? (
									<Tag color="green">Công khai (Public)</Tag>
								) : (
									<Tag>Riêng tư (Private)</Tag>
								)}
							</div>
						</div>

						{selectedQuestion.type === "multiple_choice" && (
							<>
								<Divider>Các đáp án</Divider>

								{selectedQuestion.choices && selectedQuestion.choices.length > 0 ? (
									<Space direction="vertical" style={{ width: "100%" }}>
										{selectedQuestion.choices.map((choice, index) => (
											<Card
												key={choice.id || index}
												size="small"
												style={{
													backgroundColor: choice.isCorrect
														? "#f6ffed"
														: "#fafafa",
													borderColor: choice.isCorrect ? "#52c41a" : "#d9d9d9",
												}}
											>
												<div
													style={{
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center",
													}}
												>
													<Text>{choice.content}</Text>
													{choice.isCorrect ? (
														<Tag icon={<CheckCircleOutlined />} color="success">
															Đáp án đúng
														</Tag>
													) : (
														<Tag icon={<CloseCircleOutlined />} color="default">
															Sai
														</Tag>
													)}
												</div>
											</Card>
										))}
									</Space>
								) : (
									<Text type="secondary">Không có đáp án nào</Text>
								)}
							</>
						)}

						{selectedQuestion.type === "coding" && (
							<>
								<Divider>Test Cases</Divider>

								{detailTestCases && detailTestCases.length > 0 ? (
									<Space direction="vertical" style={{ width: "100%" }}>
										{detailTestCases.map((testCase, index) => (
											<Card
												key={testCase.id || index}
												size="small"
												title={
													<Space>
														<CodeOutlined />
														Test Case {testCase.order}
														{testCase.isHidden && (
															<Tag color="orange">Ẩn</Tag>
														)}
													</Space>
												}
												extra={<Tag color="green">{testCase.points} điểm</Tag>}
											>
												<Row gutter={16}>
													<Col span={12}>
														<Text strong>Input:</Text>
														<pre
															style={{
																backgroundColor: "#f5f5f5",
																padding: 8,
																borderRadius: 4,
																marginTop: 4,
															}}
														>
															{testCase.input}
														</pre>
													</Col>
													<Col span={12}>
														<Text strong>Expected Output:</Text>
														<pre
															style={{
																backgroundColor: "#f5f5f5",
																padding: 8,
																borderRadius: 4,
																marginTop: 4,
															}}
														>
															{testCase.expectedOutput}
														</pre>
													</Col>
												</Row>
											</Card>
										))}
									</Space>
								) : (
									<Text type="secondary">Không có test case nào</Text>
								)}
							</>
						)}

						{selectedQuestion.type === "essay" && (
							<Card size="small" style={{ backgroundColor: "#f0f5ff" }}>
								<Text type="secondary">
									Đây là câu hỏi tự luận. Sinh viên sẽ nhập câu trả lời tự do.
								</Text>
							</Card>
						)}

						<Divider />

						<div style={{ fontSize: 12, color: "#999" }}>
							<Row gutter={16}>
								<Col span={12}>
									<Text type="secondary">
										Ngày tạo:{" "}
										{selectedQuestion.createdAt
											? dayjs(selectedQuestion.createdAt).format(
												"DD/MM/YYYY HH:mm:ss"
											)
											: "—"}
									</Text>
								</Col>
								<Col span={12}>
									<Text type="secondary">
										Cập nhật:{" "}
										{selectedQuestion.updatedAt
											? dayjs(selectedQuestion.updatedAt).format(
												"DD/MM/YYYY HH:mm:ss"
											)
											: "—"}
									</Text>
								</Col>
							</Row>
						</div>
					</div>
				)}			</Modal>


		</div>


	);
}



