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
	DatePicker,
	Select,
	Row,
	Col,
	Checkbox,
	Divider,
	Space,
	Card,
	Statistic,
	InputNumber,
	Alert,
	Drawer,
	Grid,
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	BookOutlined,
	ApartmentOutlined,
	FilterOutlined,
	ClearOutlined,
	ThunderboltOutlined,
	WarningOutlined,
	CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FileQuestion } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { v4 as uuidv4 } from "uuid";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// ==================== TYPES ====================
type Assignment = {
	id: number;
	sectionId?: number;
	title: string;
	description?: string;
	type: "exercise" | "quiz" | "project" | "exam";
	dueDate?: string;
	maxScore: number;
	passingScore?: number;
	timeLimit?: number;
	maxAttempts?: number;
	createdBy?: number;
	originalAssignmentId?: string;
	shuffleQuestions?: boolean;
	showAnswersAfterSubmit?: boolean;
	allowLateSubmission?: boolean;
	createdAt?: string;
	updatedAt?: string;
};

type Section = {
	id: number;
	sectionCode: string;
	sectionName: string;
};

type Question = {
	id: number;
	content: string;
	type: string;
	difficulty?: "easy" | "medium" | "hard";
	points?: number;
	subjectId?: number;
	chapterId?: number;
	subject?: {
		id: number;
		subjectCode: string;
		subjectName: string;
	};
	chapter?: {
		id: number;
		chapterCode: string;
		chapterName: string;
	};
};

type QuestionSubject = {
	id: number;
	subjectCode: string;
	subjectName: string;
};

type Chapter = {
	id: number;
	subjectId: number;
	chapterCode: string;
	chapterName: string;
};

type ApiResponse<T> = {
	success: boolean;
	data: T;
	meta?: any;
};

// ==================== COMPONENT ====================
export default function AssignmentsAdmin() {
	const screens = useBreakpoint();
	const isMobile = !screens.md;
	const isTablet = screens.md && !screens.lg;

	// ==================== STATE ====================
	const [loading, setLoading] = useState(true);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [sections, setSections] = useState<Section[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [keyword, setKeyword] = useState("");

	const [form] = Form.useForm();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Assignment | null>(null);

	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [selectedAssignment, setSelectedAssignment] =
		useState<Assignment | null>(null);
	const [assignedSectionIds, setAssignedSectionIds] = useState<number[]>([]);
	const [tempSelectedSectionIds, setTempSelectedSectionIds] = useState<
		number[]
	>([]);
	const [savingAssignment, setSavingAssignment] = useState(false);

	const [assignedQuestionIds, setAssignedQuestionIds] = useState<number[]>([]);
	const [tempSelectedQuestionIds, setTempSelectedQuestionIds] = useState<
		number[]
	>([]);
	const [loadingQuestions, setLoadingQuestions] = useState(false);
	const [questionKeyword, setQuestionKeyword] = useState("");

	const [questionSubjects, setQuestionSubjects] = useState<QuestionSubject[]>(
		[]
	);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [selectedSubjectId, setSelectedSubjectId] = useState<
		number | undefined
	>();
	const [selectedChapterId, setSelectedChapterId] = useState<
		number | undefined
	>();
	const [selectedDifficulty, setSelectedDifficulty] = useState<
		string | undefined
	>();
	const [selectedType, setSelectedType] = useState<string | undefined>();

	const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
	const [autoGenForm] = Form.useForm();
	const [generatingQuestions, setGeneratingQuestions] = useState(false);

	// State cho validation điểm
	const [currentMaxScore, setCurrentMaxScore] = useState<number>(10);
	const [totalSelectedPoints, setTotalSelectedPoints] = useState<number>(0);
	const [pointsValidation, setPointsValidation] = useState<{
		isValid: boolean;
		message: string;
		type: "success" | "warning" | "error";
	}>({ isValid: true, message: "", type: "success" });

	const { user } = useAuth();
	const teacherId = user?.id;

	// ==================== EFFECTS ====================
	useEffect(() => {
		fetchAssignments();
		fetchSections();
		fetchQuestionSubjects();
	}, []);

	useEffect(() => {
		fetchQuestions();
	}, [selectedSubjectId, selectedChapterId, selectedDifficulty, selectedType]);

	useEffect(() => {
		if (selectedSubjectId) {
			fetchChaptersBySubject(selectedSubjectId);
		} else {
			setChapters([]);
			setSelectedChapterId(undefined);
		}
	}, [selectedSubjectId]);

	useEffect(() => {
		calculateTotalPoints();
	}, [tempSelectedQuestionIds, questions, currentMaxScore]);

	// ==================== HANDLERS ====================
	const handleFormValuesChange = (changedValues: any, _allValues: any) => {
		if (changedValues.maxScore !== undefined) {
			setCurrentMaxScore(Number(changedValues.maxScore) || 10);
		}
	};

	const calculateTotalPoints = () => {
		const selectedQuestions = questions.filter((q) =>
			tempSelectedQuestionIds.includes(q.id)
		);

		const total = selectedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
		setTotalSelectedPoints(total);

		if (total === 0) {
			setPointsValidation({
				isValid: true,
				message: "Chưa chọn câu hỏi nào",
				type: "warning",
			});
		} else if (total < currentMaxScore) {
			setPointsValidation({
				isValid: false,
				message: `Tổng điểm (${total}) nhỏ hơn điểm tối đa (${currentMaxScore}). Cần thêm ${currentMaxScore - total
					} điểm. `,
				type: "warning",
			});
		} else if (total > currentMaxScore) {
			setPointsValidation({
				isValid: false,
				message: `Tổng điểm (${total}) vượt quá điểm tối đa (${currentMaxScore}). Cần giảm ${total - currentMaxScore
					} điểm.`,
				type: "error",
			});
		} else {
			setPointsValidation({
				isValid: true,
				message: `Tổng điểm hợp lệ: ${total}/${currentMaxScore}`,
				type: "success",
			});
		}
	};

	// ==================== API CALLS ====================
	async function fetchAssignments() {
		try {
			setLoading(true);
			const res = await instance.get<ApiResponse<Assignment[]>>(`/assignments`);
			if (res.data.success) {
				setAssignments(res.data.data || []);
			}
		} catch (error) {
			console.error("❌ Fetch assignments error:", error);
			toast.error("Không tải được danh sách bài tập");
		} finally {
			setLoading(false);
		}
	}

	async function fetchSections() {
		try {
			const res = await instance.get<ApiResponse<Section[]>>(
				`/course-sections`
			);
			if (res.data.success) {
				setSections(res.data.data || []);
			}
		} catch {
			toast.error("Không tải được danh sách lớp");
		}
	}

	async function fetchQuestionSubjects() {
		try {
			const res = await instance.get<ApiResponse<QuestionSubject[]>>(
				`/subjects? limit=100`
			);
			if (res.data.success) {
				setQuestionSubjects(res.data.data || []);
			}
		} catch {
			toast.error("Không tải được danh sách môn học");
		}
	}

	async function fetchChaptersBySubject(subjectId: number) {
		try {
			const res = await instance.get<ApiResponse<Chapter[]>>(
				`/questions/${subjectId}/chapters`
			);
			if (res.data.success) {
				setChapters(res.data.data || []);
			}
		} catch {
			toast.error("Không tải được danh sách chương");
			setChapters([]);
		}
	}

	async function fetchQuestions() {
		try {
			setLoadingQuestions(true);
			const params: Record<string, any> = { page: 1, limit: 1000 };

			if (selectedSubjectId) params.subjectId = selectedSubjectId;
			if (selectedChapterId) params.chapterId = selectedChapterId;
			if (selectedDifficulty) params.difficulty = selectedDifficulty;
			if (selectedType) params.type = selectedType;

			const res = await instance.get<
				ApiResponse<Question[] | { items: Question[] }>
			>(`/questions`, { params });

			if (res.data.success) {
				const items = Array.isArray(res.data.data)
					? res.data.data
					: (res.data.data as any).items || [];
				setQuestions(items);
			}
		} catch (error) {
			console.error("Error fetching questions:", error);
			toast.error("Không tải được danh sách câu hỏi");
		} finally {
			setLoadingQuestions(false);
		}
	}

	const handleDelete = async (id: number) => {
		try {
			await instance.delete(`/assignments/${id}`);
			toast.success("Đã xóa bài tập");
			setAssignments((prev) => prev.filter((a) => a.id !== id));
		} catch {
			toast.error("Không thể xóa bài tập");
		}
	};

	const handleSubmit = async () => {
		if (tempSelectedQuestionIds.length > 0 && !pointsValidation.isValid) {
			Modal.error({
				title: "Không thể lưu bài tập",
				content: pointsValidation.message,
				okText: "Đã hiểu",
			});
			return;
		}

		try {
			const values = await form.validateFields();
			const uniqueCode = uuidv4();

			const payload = {
				...(values.sectionId ? { sectionId: Number(values.sectionId) } : {}),
				title: values.title.trim(),
				description: values.description?.trim(),
				type: values.type,
				dueDate: values.dueDate ? values.dueDate.toISOString() : null,
				maxScore: Number(values.maxScore || 10),
				passingScore: values.passingScore ? Number(values.passingScore) : null,
				timeLimit: values.timeLimit ? Number(values.timeLimit) : null,
				maxAttempts: values.maxAttempts ? Number(values.maxAttempts) : 1,
				shuffleQuestions: values.shuffleQuestions || false,
				showAnswersAfterSubmit: values.showAnswersAfterSubmit || false,
				allowLateSubmission: values.allowLateSubmission || false,
				createdBy: teacherId,
				originalAssignmentId: uniqueCode,
			};

			let assignmentId: number;

			if (editing) {
				await instance.put(`/assignments/${editing.id}`, payload);
				assignmentId = editing.id;
				toast.success("Đã cập nhật bài tập");
			} else {
				const res = await instance.post<ApiResponse<{ id: number }>>(
					`/assignments`,
					payload
				);
				assignmentId = res.data.data.id;
				toast.success("Đã tạo bài tập mới");
			}

			await saveQuestionAssignments(assignmentId);

			setModalOpen(false);
			setEditing(null);
			form.resetFields();
			setTempSelectedQuestionIds([]);
			setAssignedQuestionIds([]);
			setCurrentMaxScore(10);
			setTotalSelectedPoints(0);
			resetFilters();
			fetchAssignments();
		} catch (err: any) {
			if (err?.errorFields) return;
			toast.error(
				err?.response?.data?.message || "Không thể lưu thông tin bài tập"
			);
		}
	};

	const saveQuestionAssignments = async (assignmentId: number) => {
		try {
			const toAdd = tempSelectedQuestionIds.filter(
				(id) => !assignedQuestionIds.includes(id)
			);

			const toRemove = assignedQuestionIds.filter(
				(id) => !tempSelectedQuestionIds.includes(id)
			);

			const addPromises = toAdd.map((questionId) =>
				instance.post(
					`/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
				)
			);

			const removePromises = toRemove.map((questionId) =>
				instance.delete(
					`/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
				)
			);

			await Promise.all([...addPromises, ...removePromises]);

			if (toAdd.length > 0 || toRemove.length > 0) {
				toast.success(
					`Đã cập nhật câu hỏi (thêm: ${toAdd.length}, xóa: ${toRemove.length})`
				);
			}
		} catch (error: any) {
			console.error("Error saving question assignments:", error);
			toast.error(
				error?.response?.data?.message || "Không thể cập nhật câu hỏi"
			);
			throw error;
		}
	};

	const openAssignModal = async (assignment: Assignment) => {
		setSelectedAssignment(assignment);
		try {
			const res = await instance.get<ApiResponse<Array<{ sectionId: number }>>>(
				`/sections-assignments/assignments/${assignment.id}/sections`
			);
			if (res.data.success) {
				const sectionIds = res.data.data.map((s) => s.sectionId);
				setAssignedSectionIds(sectionIds);
				setTempSelectedSectionIds(sectionIds);
			}
		} catch {
			toast.error("Không tải được danh sách lớp đã gán");
			setAssignedSectionIds([]);
			setTempSelectedSectionIds([]);
		}
		setAssignModalOpen(true);
	};

	const openCreateEditModal = async (assignment?: Assignment) => {
		if (assignment) {
			setEditing(assignment);
			setCurrentMaxScore(assignment.maxScore || 10);
			form.setFieldsValue({
				...assignment,
				dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
			});

			setLoadingQuestions(true);
			try {
				const res = await instance.get<
					ApiResponse<
						Array<{ assignmentId: number; questionId: number; question: Question }>
					>
				>(`/assignments-questions/assignments/${assignment.id}/questions`);

				if (res.data.success && res.data.data) {
					const questionIds = res.data.data.map((item) => item.questionId);
					setAssignedQuestionIds(questionIds);
					setTempSelectedQuestionIds(questionIds);
				} else {
					setAssignedQuestionIds([]);
					setTempSelectedQuestionIds([]);
				}
			} catch (error) {
				console.error("Error loading assigned questions:", error);
				toast.error("Không tải được danh sách câu hỏi đã gán");
				setAssignedQuestionIds([]);
				setTempSelectedQuestionIds([]);
			} finally {
				setLoadingQuestions(false);
			}
		} else {
			setEditing(null);
			setCurrentMaxScore(10);
			form.resetFields();
			form.setFieldValue("maxScore", 10);
			setAssignedQuestionIds([]);
			setTempSelectedQuestionIds([]);
			setTotalSelectedPoints(0);
		}
		resetFilters();
		setModalOpen(true);
	};

	const openAutoGenModal = (assignment?: Assignment) => {
		if (assignment) {
			setEditing(assignment);
		} else {
			setEditing(null);
			form.resetFields();
		}
		autoGenForm.resetFields();
		setAutoGenModalOpen(true);
	};

	const handleAutoGenerate = async () => {
		try {
			const values = await autoGenForm.validateFields();

			if (!editing) {
				toast.error("Vui lòng tạo bài tập trước khi tự động tạo câu hỏi");
				return;
			}

			setGeneratingQuestions(true);

			const res = await instance.post<
				ApiResponse<{ totalQuestionsAdded: number }>
			>(`/assignment-generator/generate`, {
				assignmentId: editing.id,
				subjectId: values.subjectId,
				totalScore: 10,
				chapterRules: values.chapterRules || [],
			});

			if (res.data.success) {
				toast.success(
					`Đã tự động tạo ${res.data.data.totalQuestionsAdded} câu hỏi! `
				);
				setAutoGenModalOpen(false);
				autoGenForm.resetFields();
				fetchAssignments();
			}
		} catch (err: any) {
			if (err?.errorFields) return;
			toast.error(
				err?.response?.data?.message || "Không thể tự động tạo câu hỏi"
			);
		} finally {
			setGeneratingQuestions(false);
		}
	};

	const toggleTempSelection = (sectionId: number, checked: boolean) => {
		if (checked) {
			setTempSelectedSectionIds((prev) => [...prev, sectionId]);
		} else {
			setTempSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
		}
	};

	const toggleTempQuestionSelection = (questionId: number, checked: boolean) => {
		if (checked) {
			setTempSelectedQuestionIds((prev) => [...prev, questionId]);
		} else {
			setTempSelectedQuestionIds((prev) =>
				prev.filter((id) => id !== questionId)
			);
		}
	};

	const handleSaveAssignment = async () => {
		if (!selectedAssignment) return;

		setSavingAssignment(true);
		try {
			const toAdd = tempSelectedSectionIds.filter(
				(id) => !assignedSectionIds.includes(id)
			);

			const toRemove = assignedSectionIds.filter(
				(id) => !tempSelectedSectionIds.includes(id)
			);

			const addPromises = toAdd.map((sectionId) =>
				instance.post(
					`/sections-assignments/sections/${sectionId}/assignments`,
					{
						assignmentId: selectedAssignment.id,
					}
				)
			);

			const removePromises = toRemove.map((sectionId) =>
				instance.delete(
					`/sections-assignments/sections/${sectionId}/assignments/${selectedAssignment.id}`
				)
			);

			await Promise.all([...addPromises, ...removePromises]);

			toast.success("Đã cập nhật gán lớp thành công");
			setAssignedSectionIds(tempSelectedSectionIds);
			setAssignModalOpen(false);
			setSelectedAssignment(null);
		} catch (error) {
			toast.error("Không thể cập nhật gán lớp");
		} finally {
			setSavingAssignment(false);
		}
	};

	const resetFilters = () => {
		setSelectedSubjectId(undefined);
		setSelectedChapterId(undefined);
		setSelectedDifficulty(undefined);
		setSelectedType(undefined);
		setQuestionKeyword("");
	};

	// ==================== RENDER HELPERS ====================
	const renderDifficultyTag = (difficulty?: string) => {
		const config: Record<string, { color: string; text: string }> = {
			easy: { color: "green", text: "Dễ" },
			medium: { color: "orange", text: "Trung bình" },
			hard: { color: "red", text: "Khó" },
		};
		if (!difficulty) return null;
		const diff = config[difficulty] || { color: "default", text: difficulty };
		return <Tag color={diff.color}>{diff.text}</Tag>;
	};

	const renderTypeTag = (type: string) => {
		const config: Record<string, { color: string; text: string }> = {
			multiple_choice: { color: "blue", text: "Trắc nghiệm" },
			essay: { color: "purple", text: "Tự luận" },
			coding: { color: "cyan", text: "Lập trình" },
			true_false: { color: "geekblue", text: "Đúng/Sai" },
		};
		const t = config[type] || { color: "default", text: type };
		return <Tag color={t.color}>{t.text}</Tag>;
	};

	// ==================== TABLE COLUMNS ====================
	const columns = [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			key: "title",
			render: (text: string) => <strong>{text}</strong>,
			responsive: ["xs", "sm", "md", "lg", "xl"] as any,
		},
		{
			title: "Loại",
			dataIndex: "type",
			key: "type",
			render: (type: string) => {
				const colors: Record<string, string> = {
					exercise: "blue",
					quiz: "purple",
					project: "orange",
					exam: "red",
				};
				return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
			},
			responsive: ["sm", "md", "lg", "xl"] as any,
		},
		{
			title: "Điểm",
			dataIndex: "maxScore",
			key: "maxScore",
			align: "center" as const,
			responsive: ["md", "lg", "xl"] as any,
		},
		{
			title: "Hạn nộp",
			dataIndex: "dueDate",
			key: "dueDate",
			render: (v: string) =>
				v ? dayjs(v).format("DD/MM/YYYY HH:mm") : <Tag>Không</Tag>,
			responsive: ["lg", "xl"] as any,
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
			responsive: ["xl"] as any,
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			fixed: isMobile ? undefined : ("right" as const),
			width: isMobile ? undefined : 180,
			render: (_: any, record: Assignment) => (
				<Space size="small" wrap>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => openCreateEditModal(record)}
						/>
					</Tooltip>
					<Tooltip title="Tự động tạo câu hỏi">
						<Button
							icon={<ThunderboltOutlined />}
							size="small"
							type="primary"
							ghost
							onClick={() => openAutoGenModal(record)}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa bài tập"
							description="Bạn có chắc muốn xóa bài tập này?"
							okText="Xóa"
							cancelText="Hủy"
							okButtonProps={{ danger: true }}
							onConfirm={() => handleDelete(record.id)}
						>
							<Button danger size="small" icon={<DeleteOutlined />} />
						</Popconfirm>
					</Tooltip>
					<Tooltip title="Gán vào lớp">
						<Button
							icon={<ApartmentOutlined />}
							size="small"
							onClick={() => openAssignModal(record)}
						/>
					</Tooltip>
				</Space>
			),
		},
	];

	const filteredAssignments = assignments.filter((a) => {
		if (!keyword) return true;
		const kw = keyword.toLowerCase();
		return (
			a.title.toLowerCase().includes(kw) ||
			a.description?.toLowerCase().includes(kw) ||
			a.type.toLowerCase().includes(kw)
		);
	});

	const filteredQuestions = questions.filter((q) => {
		if (!questionKeyword) return true;
		const kw = questionKeyword.toLowerCase();
		return (
			q.content.toLowerCase().includes(kw) ||
			q.type?.toLowerCase().includes(kw) ||
			q.difficulty?.toLowerCase().includes(kw)
		);
	});

	return (
		<div className="p-3 ">
			{/* Header */}
			<div className="flex flex-col gap-4 mb-4 md:flex-row md:justify-between md:items-center">
				<Title level={isMobile ? 4 : 3} className="! mb-0">
					<div className="flex items-center gap-2">
						<FileQuestion size={isMobile ? 20 : 24} />
						<span>Quản lý Bài tập</span>
					</div>
				</Title>

				<Space direction={isMobile ? "vertical" : "horizontal"} className="w-full md:w-auto">
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder={isMobile ? "Tìm kiếm..." : "Tìm theo tiêu đề, mô tả, loại... "}
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						className="w-full md:w-64 lg:w-96"
					/>
					<Space>
						<Button icon={<ReloadOutlined />} onClick={fetchAssignments}>
							{!isMobile && "Làm mới"}
						</Button>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => openCreateEditModal()}
						>
							{isMobile ? "Thêm" : "Thêm bài tập"}
						</Button>
					</Space>
				</Space>
			</div>

			{/* Table */}
			{loading ? (
				<div className="text-center py-16">
					<Spin size="large" tip="Đang tải danh sách bài tập..." />
				</div>
			) : (
				<Table<Assignment>
					dataSource={filteredAssignments}
					columns={columns}
					rowKey="id"
					bordered
					scroll={{ x: isMobile ? 800 : undefined }}
					pagination={{
						pageSize: 10,
						showSizeChanger: !isMobile,
						showTotal: (total) => `Tổng ${total} bài tập`,
						responsive: true,
					}}
					locale={{ emptyText: "Không có bài tập nào" }}
					size={isMobile ? "small" : "middle"}
				/>
			)}

			{/* Modal thêm/sửa */}
			{isMobile ? (
				<Drawer
					title={editing ? "Sửa bài tập" : "Thêm bài tập mới"}
					open={modalOpen}
					onClose={() => {
						setModalOpen(false);
						setEditing(null);
						setTempSelectedQuestionIds([]);
						setAssignedQuestionIds([]);
						setCurrentMaxScore(10);
						setTotalSelectedPoints(0);
						resetFilters();
					}}
					width="100%"
					extra={
						<Space>
							<Button
								onClick={() => {
									setModalOpen(false);
									setEditing(null);
								}}
							>
								Hủy
							</Button>
							<Button
								type="primary"
								onClick={handleSubmit}
								disabled={
									tempSelectedQuestionIds.length > 0 && !pointsValidation.isValid
								}
							>
								{editing ? "Lưu" : "Tạo"}
							</Button>
						</Space>
					}
				>
					{/* Form bài tập */}
					<div className="mb-6">
						<Title level={5} className="mb-3">
							Thông tin bài tập
						</Title>
						<Form
							form={form}
							layout="vertical"
							onValuesChange={handleFormValuesChange}
						>
							<Form.Item
								label="Tiêu đề"
								name="title"
								rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
							>
								<Input placeholder="VD: Bài tập OOP" />
							</Form.Item>

							<Form.Item label="Mô tả" name="description">
								<Input.TextArea rows={3} placeholder="Mô tả chi tiết bài tập" />
							</Form.Item>

							<Form.Item
								label="Loại bài tập"
								name="type"
								rules={[{ required: true, message: "Vui lòng chọn loại" }]}
							>
								<Select placeholder="Chọn loại bài tập">
									<Option value="exercise">Exercise</Option>
									<Option value="quiz">Quiz</Option>
									<Option value="project">Project</Option>
									<Option value="exam">Exam</Option>
								</Select>
							</Form.Item>

							<Form.Item label="Hạn nộp" name="dueDate">
								<DatePicker
									showTime
									format="YYYY-MM-DD HH:mm"
									className="w-full"
								/>
							</Form.Item>

							<Divider>Cấu hình</Divider>

							<Row gutter={16}>
								<Col span={12}>
									<Form.Item
										label="Điểm tối đa"
										name="maxScore"
										initialValue={10}
										rules={[
											{ required: true, message: "Vui lòng nhập điểm" },
											{ type: "number", min: 1, message: "Điểm phải > 0" },
										]}
									>
										<InputNumber min={1} className="w-full" />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item label="Điểm đạt" name="passingScore">
										<InputNumber min={0} className="w-full" />
									</Form.Item>
								</Col>
							</Row>

							<Row gutter={16}>
								<Col span={12}>
									<Form.Item label="Thời gian (phút)" name="timeLimit">
										<InputNumber min={0} className="w-full" />
									</Form.Item>
								</Col>
								<Col span={12}>
									<Form.Item
										label="Số lần nộp"
										name="maxAttempts"
										initialValue={1}
									>
										<InputNumber min={1} className="w-full" />
									</Form.Item>
								</Col>
							</Row>

							<Form.Item name="shuffleQuestions" valuePropName="checked">
								<Checkbox>Xáo trộn câu hỏi</Checkbox>
							</Form.Item>
							<Form.Item name="showAnswersAfterSubmit" valuePropName="checked">
								<Checkbox>Hiện đáp án sau khi nộp</Checkbox>
							</Form.Item>
							<Form.Item name="allowLateSubmission" valuePropName="checked">
								<Checkbox>Cho phép nộp muộn</Checkbox>
							</Form.Item>
						</Form>
					</div>

					{/* Danh sách câu hỏi */}
					<div>
						<div className="flex justify-between items-center mb-3">
							<Title level={5} className="!mb-0">
								Câu hỏi
							</Title>
							<Space size="small">
								<Button
									icon={<ThunderboltOutlined />}
									size="small"
									type="primary"
									onClick={() => openAutoGenModal(editing || undefined)}
									disabled={!editing}
								>
									Tự động
								</Button>
								<Button icon={<ClearOutlined />} size="small" onClick={resetFilters}>
									Xóa lọc
								</Button>
							</Space>
						</div>

						{tempSelectedQuestionIds.length > 0 && (
							<Alert
								message={
									<Space>
										{pointsValidation.type === "success" ? (
											<CheckCircleOutlined />
										) : (
											<WarningOutlined />
										)}
										{pointsValidation.message}
									</Space>
								}
								type={pointsValidation.type}
								showIcon
								className="mb-3"
								banner
							/>
						)}

						<Card size="small" className="mb-3 bg-gray-50">
							<Space direction="vertical" className="w-full" size="small">
								<Select
									allowClear
									placeholder="Môn học"
									value={selectedSubjectId}
									onChange={setSelectedSubjectId}
									className="w-full"
									size="small"
								>
									{questionSubjects.map((s) => (
										<Option key={s.id} value={s.id}>
											{s.subjectCode} - {s.subjectName}
										</Option>
									))}
								</Select>
								<Select
									allowClear
									placeholder="Chương"
									value={selectedChapterId}
									onChange={setSelectedChapterId}
									disabled={!selectedSubjectId}
									className="w-full"
									size="small"
								>
									{chapters.map((c) => (
										<Option key={c.id} value={c.id}>
											{c.chapterCode} - {c.chapterName}
										</Option>
									))}
								</Select>
								<Row gutter={8}>
									<Col span={12}>
										<Select
											allowClear
											placeholder="Độ khó"
											value={selectedDifficulty}
											onChange={setSelectedDifficulty}
											className="w-full"
											size="small"
										>
											<Option value="easy">Dễ</Option>
											<Option value="medium">Trung bình</Option>
											<Option value="hard">Khó</Option>
										</Select>
									</Col>
									<Col span={12}>
										<Select
											allowClear
											placeholder="Loại"
											value={selectedType}
											onChange={setSelectedType}
											className="w-full"
											size="small"
										>
											<Option value="multiple_choice">Trắc nghiệm</Option>
											<Option value="essay">Tự luận</Option>
											<Option value="coding">Lập trình</Option>
											<Option value="true_false">Đúng/Sai</Option>
										</Select>
									</Col>
								</Row>
							</Space>
						</Card>

						<Input
							allowClear
							prefix={<SearchOutlined />}
							placeholder="Tìm câu hỏi..."
							value={questionKeyword}
							onChange={(e) => setQuestionKeyword(e.target.value)}
							className="mb-3"
							size="small"
						/>

						<Card size="small" className="mb-3">
							<Row gutter={8}>
								<Col span={8}>
									<Statistic
										title="Tổng câu"
										value={questions.length}
										valueStyle={{ fontSize: 16 }}
									/>
								</Col>
								<Col span={8}>
									<Statistic
										title="Đã chọn"
										value={tempSelectedQuestionIds.length}
										valueStyle={{ fontSize: 16, color: "#1890ff" }}
									/>
								</Col>
								<Col span={8}>
									<Statistic
										title="Điểm"
										value={`${totalSelectedPoints}/${currentMaxScore}`}
										valueStyle={{
											fontSize: 16,
											color: pointsValidation.isValid
												? "#52c41a"
												: pointsValidation.type === "error"
													? "#ff4d4f"
													: "#faad14",
										}}
									/>
								</Col>
							</Row>
						</Card>

						<div className="max-h-96 overflow-y-auto border border-gray-200 rounded p-3">
							{loadingQuestions ? (
								<div className="text-center py-8">
									<Spin tip="Đang tải câu hỏi..." />
								</div>
							) : filteredQuestions.length === 0 ? (
								<div className="text-center py-8 text-gray-400">
									<FilterOutlined className="text-3xl mb-2" />
									<p>Không tìm thấy câu hỏi</p>
									<Button size="small" onClick={resetFilters}>
										Xóa bộ lọc
									</Button>
								</div>
							) : (
								filteredQuestions.map((q) => {
									const checked = tempSelectedQuestionIds.includes(q.id);
									return (
										<label
											key={q.id}
											className={`block p-3 mb-2 border rounded cursor-pointer transition-all ${checked ? "bg-blue-50 border-blue-300" : "border-gray-200"
												}`}
										>
											<div className="flex items-start gap-2">
												<input
													type="checkbox"
													checked={checked}
													onChange={(e) =>
														toggleTempQuestionSelection(q.id, e.target.checked)
													}
													className="mt-1 cursor-pointer"
												/>
												<div className="flex-1">
													<div
														className="font-medium mb-1 text-sm"
														dangerouslySetInnerHTML={{
															__html:
																q.content.substring(0, 80) +
																(q.content.length > 80 ? "..." : ""),
														}}
													/>
													<div className="flex flex-wrap gap-1">
														{renderTypeTag(q.type)}
														{renderDifficultyTag(q.difficulty)}
														{q.points && <Tag color="green">{q.points} điểm</Tag>}
														{q.subject && (
															<Tag color="blue" icon={<BookOutlined />}>
																{q.subject.subjectCode}
															</Tag>
														)}
														{q.chapter && (
															<Tag color="purple">{q.chapter.chapterCode}</Tag>
														)}
													</div>
												</div>
											</div>
										</label>
									);
								})
							)}
						</div>
					</div>
				</Drawer>
			) : (
				<Modal
					title={editing ? "Sửa thông tin bài tập" : "Thêm bài tập mới"}
					open={modalOpen}
					onCancel={() => {
						setModalOpen(false);
						setEditing(null);
						setTempSelectedQuestionIds([]);
						setAssignedQuestionIds([]);
						setCurrentMaxScore(10);
						setTotalSelectedPoints(0);
						resetFilters();
					}}
					onOk={handleSubmit}
					okText={editing ? "Lưu" : "Tạo mới"}
					cancelText="Hủy"
					okButtonProps={{
						disabled:
							tempSelectedQuestionIds.length > 0 && !pointsValidation.isValid,
					}}
					width={isTablet ? "90%" : 1400}
					centered
					bodyStyle={{
						maxHeight: "75vh",
						overflowY: "auto",
						overflowX: "hidden",
					}}
				>
					<Row gutter={24}>
						<Col xs={24} lg={10}>
							<Title level={5} className="mb-3">
								Thông tin bài tập
							</Title>
							<Form
								form={form}
								layout="vertical"
								onValuesChange={handleFormValuesChange}
							>
								<Form.Item
									label="Tiêu đề"
									name="title"
									rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
								>
									<Input placeholder="VD: Bài tập OOP" />
								</Form.Item>

								<Form.Item label="Mô tả" name="description">
									<Input.TextArea rows={3} placeholder="Mô tả chi tiết bài tập" />
								</Form.Item>

								<Form.Item
									label="Loại bài tập"
									name="type"
									rules={[{ required: true, message: "Vui lòng chọn loại" }]}
								>
									<Select placeholder="Chọn loại bài tập">
										<Option value="exercise">Exercise</Option>
										<Option value="quiz">Quiz</Option>
										<Option value="project">Project</Option>
										<Option value="exam">Exam</Option>
									</Select>
								</Form.Item>

								<Form.Item label="Hạn nộp" name="dueDate">
									<DatePicker
										showTime
										format="YYYY-MM-DD HH:mm"
										className="w-full"
									/>
								</Form.Item>

								<Divider>Cấu hình</Divider>

								<Row gutter={16}>
									<Col span={12}>
										<Form.Item
											label="Điểm tối đa"
											name="maxScore"
											initialValue={10}
											rules={[
												{ required: true, message: "Vui lòng nhập điểm" },
												{ type: "number", min: 1, message: "Điểm phải > 0" },
											]}
										>
											<InputNumber min={1} className="w-full" />
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item label="Điểm đạt" name="passingScore">
											<InputNumber min={0} className="w-full" />
										</Form.Item>
									</Col>
								</Row>

								<Row gutter={16}>
									<Col span={12}>
										<Form.Item label="Thời gian (phút)" name="timeLimit">
											<InputNumber min={0} className="w-full" />
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item
											label="Số lần nộp"
											name="maxAttempts"
											initialValue={1}
										>
											<InputNumber min={1} className="w-full" />
										</Form.Item>
									</Col>
								</Row>

								<Form.Item name="shuffleQuestions" valuePropName="checked">
									<Checkbox>Xáo trộn câu hỏi</Checkbox>
								</Form.Item>
								<Form.Item name="showAnswersAfterSubmit" valuePropName="checked">
									<Checkbox>Hiện đáp án sau khi nộp</Checkbox>
								</Form.Item>
								<Form.Item name="allowLateSubmission" valuePropName="checked">
									<Checkbox>Cho phép nộp muộn</Checkbox>
								</Form.Item>
							</Form>
						</Col>

						<Col xs={24} lg={14}>
							<div className="flex justify-between items-center mb-3">
								<Title level={5} className="!mb-0">
									Câu hỏi
								</Title>
								<Space>
									<Button
										icon={<ThunderboltOutlined />}
										size="small"
										type="primary"
										onClick={() => openAutoGenModal(editing || undefined)}
										disabled={!editing}
									>
										Tự động tạo
									</Button>
									<Button
										icon={<ClearOutlined />}
										size="small"
										onClick={resetFilters}
									>
										Xóa bộ lọc
									</Button>
								</Space>
							</div>

							{tempSelectedQuestionIds.length > 0 && (
								<Alert
									message={
										<Space>
											{pointsValidation.type === "success" ? (
												<CheckCircleOutlined />
											) : (
												<WarningOutlined />
											)}
											{pointsValidation.message}
										</Space>
									}
									type={pointsValidation.type}
									showIcon
									className="mb-3"
									banner
								/>
							)}

							<Card size="small" className="mb-3 bg-gray-50">
								<Space direction="vertical" className="w-full" size="small">
									<Row gutter={8}>
										<Col span={12}>
											<Text type="secondary" className="text-xs">
												Môn học:
											</Text>
											<Select
												allowClear
												placeholder="Chọn môn học"
												value={selectedSubjectId}
												onChange={setSelectedSubjectId}
												className="w-full"
												size="small"
											>
												{questionSubjects.map((s) => (
													<Option key={s.id} value={s.id}>
														{s.subjectCode} - {s.subjectName}
													</Option>
												))}
											</Select>
										</Col>
										<Col span={12}>
											<Text type="secondary" className="text-xs">
												Chương:
											</Text>
											<Select
												allowClear
												placeholder="Chọn chương"
												value={selectedChapterId}
												onChange={setSelectedChapterId}
												disabled={!selectedSubjectId}
												className="w-full"
												size="small"
											>
												{chapters.map((c) => (
													<Option key={c.id} value={c.id}>
														{c.chapterCode} - {c.chapterName}
													</Option>
												))}
											</Select>
										</Col>
									</Row>
									<Row gutter={8}>
										<Col span={12}>
											<Text type="secondary" className="text-xs">
												Độ khó:
											</Text>
											<Select
												allowClear
												placeholder="Chọn độ khó"
												value={selectedDifficulty}
												onChange={setSelectedDifficulty}
												className="w-full"
												size="small"
											>
												<Option value="easy">Dễ</Option>
												<Option value="medium">Trung bình</Option>
												<Option value="hard">Khó</Option>
											</Select>
										</Col>
										<Col span={12}>
											<Text type="secondary" className="text-xs">
												Loại câu hỏi:
											</Text>
											<Select
												allowClear
												placeholder="Chọn loại"
												value={selectedType}
												onChange={setSelectedType}
												className="w-full"
												size="small"
											>
												<Option value="multiple_choice">Trắc nghiệm</Option>
												<Option value="essay">Tự luận</Option>
												<Option value="coding">Lập trình</Option>
												<Option value="true_false">Đúng/Sai</Option>
											</Select>
										</Col>
									</Row>
								</Space>
							</Card>

							<Input
								allowClear
								prefix={<SearchOutlined />}
								placeholder="Tìm theo nội dung câu hỏi..."
								value={questionKeyword}
								onChange={(e) => setQuestionKeyword(e.target.value)}
								className="mb-3"
								size="small"
							/>

							<Card size="small" className="mb-3">
								<Row gutter={16}>
									<Col span={8}>
										<Statistic
											title="Tổng số câu"
											value={questions.length}
											valueStyle={{ fontSize: 20 }}
										/>
									</Col>
									<Col span={8}>
										<Statistic
											title="Đã chọn"
											value={tempSelectedQuestionIds.length}
											valueStyle={{ fontSize: 20, color: "#1890ff" }}
										/>
									</Col>
									<Col span={8}>
										<Statistic
											title="Tổng điểm"
											value={`${totalSelectedPoints}/${currentMaxScore}`}
											valueStyle={{
												fontSize: 20,
												color: pointsValidation.isValid
													? "#52c41a"
													: pointsValidation.type === "error"
														? "#ff4d4f"
														: "#faad14",
											}}
										/>
									</Col>
								</Row>
							</Card>

							<div className="max-h-96 overflow-y-auto border border-gray-200 rounded p-3">
								{loadingQuestions ? (
									<div className="text-center py-5">
										<Spin tip="Đang tải câu hỏi..." />
									</div>
								) : filteredQuestions.length === 0 ? (
									<div className="text-center py-5 text-gray-400">
										<FilterOutlined className="text-3xl mb-2" />
										<p>Không tìm thấy câu hỏi phù hợp</p>
										<Button size="small" onClick={resetFilters}>
											Xóa bộ lọc
										</Button>
									</div>
								) : (
									filteredQuestions.map((q) => {
										const checked = tempSelectedQuestionIds.includes(q.id);
										return (
											<label
												key={q.id}
												className={`block p-3 mb-2 border rounded cursor-pointer transition-all ${checked
														? "bg-blue-50 border-blue-300"
														: "border-gray-200 hover:bg-gray-50"
													}`}
											>
												<div className="flex items-start gap-2">
													<input
														type="checkbox"
														checked={checked}
														onChange={(e) =>
															toggleTempQuestionSelection(q.id, e.target.checked)
														}
														className="mt-1 cursor-pointer"
													/>
													<div className="flex-1">
														<div
															className="font-medium mb-1"
															dangerouslySetInnerHTML={{
																__html:
																	q.content.substring(0, 100) +
																	(q.content.length > 100 ? "..." : ""),
															}}
														/>
														<div className="flex flex-wrap gap-1 text-xs">
															{renderTypeTag(q.type)}
															{renderDifficultyTag(q.difficulty)}
															{q.points && (
																<Tag color="green">{q.points} điểm</Tag>
															)}
															{q.subject && (
																<Tag color="blue" icon={<BookOutlined />}>
																	{q.subject.subjectCode}
																</Tag>
															)}
															{q.chapter && (
																<Tag color="purple">{q.chapter.chapterCode}</Tag>
															)}
														</div>
													</div>
												</div>
											</label>
										);
									})
								)}
							</div>
						</Col>
					</Row>
				</Modal>
			)}

			{/* Modal tự động tạo câu hỏi */}
			<Modal
				title={
					<Space>
						<ThunderboltOutlined />
						Tự động tạo câu hỏi
					</Space>
				}
				open={autoGenModalOpen}
				onCancel={() => {
					setAutoGenModalOpen(false);
					autoGenForm.resetFields();
				}}
				onOk={handleAutoGenerate}
				okText="Tạo câu hỏi"
				cancelText="Hủy"
				confirmLoading={generatingQuestions}
				width={isMobile ? "100%" : isTablet ? "90%" : 800}
				centered
			>
				<Form form={autoGenForm} layout="vertical">
					<Form.Item
						label="Môn học"
						name="subjectId"
						rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
					>
						<Select
							placeholder="Chọn môn học"
							onChange={(value) => {
								fetchChaptersBySubject(value);
								autoGenForm.setFieldValue("chapterRules", []);
							}}
						>
							{questionSubjects.map((s) => (
								<Option key={s.id} value={s.id}>
									{s.subjectCode} - {s.subjectName}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Divider>Cấu hình câu hỏi theo chương</Divider>

					<Form.List name="chapterRules">
						{(fields, { add, remove }) => (
							<>
								{fields.map(({ key, name, ...restField }) => (
									<Card key={key} size="small" className="mb-3">
										<Form.Item
											{...restField}
											name={[name, "chapterId"]}
											label="Chương"
											rules={[{ required: true, message: "Vui lòng chọn chương" }]}
										>
											<Select placeholder="Chọn chương">
												{chapters.map((c) => (
													<Option key={c.id} value={c.id}>
														{c.chapterCode} - {c.chapterName}
													</Option>
												))}
											</Select>
										</Form.Item>

										<Row gutter={8}>
											<Col xs={24} sm={8}>
												<Text strong>Dễ:</Text>
												<Form.Item
													{...restField}
													name={[name, "easy", "count"]}
													label="Số câu"
												>
													<InputNumber min={0} className="w-full" />
												</Form.Item>
												<Form.Item
													{...restField}
													name={[name, "easy", "pointPerQuestion"]}
													label="Điểm/câu"
												>
													<InputNumber min={0} step={0.5} className="w-full" />
												</Form.Item>
											</Col>

											<Col xs={24} sm={8}>
												<Text strong>Trung bình:</Text>
												<Form.Item
													{...restField}
													name={[name, "medium", "count"]}
													label="Số câu"
												>
													<InputNumber min={0} className="w-full" />
												</Form.Item>
												<Form.Item
													{...restField}
													name={[name, "medium", "pointPerQuestion"]}
													label="Điểm/câu"
												>
													<InputNumber min={0} step={0.5} className="w-full" />
												</Form.Item>
											</Col>

											<Col xs={24} sm={8}>
												<Text strong>Khó:</Text>
												<Form.Item
													{...restField}
													name={[name, "hard", "count"]}
													label="Số câu"
												>
													<InputNumber min={0} className="w-full" />
												</Form.Item>
												<Form.Item
													{...restField}
													name={[name, "hard", "pointPerQuestion"]}
													label="Điểm/câu"
												>
													<InputNumber min={0} step={0.5} className="w-full" />
												</Form.Item>
											</Col>
										</Row>

										<Button danger size="small" onClick={() => remove(name)}>
											Xóa chương
										</Button>
									</Card>
								))}

								<Button
									type="dashed"
									onClick={() => add()}
									block
									icon={<PlusOutlined />}
								>
									Thêm chương
								</Button>
							</>
						)}
					</Form.List>

					<Card size="small" className="mt-4 bg-yellow-50">
						<Text type="warning">
							⚠️ Tổng điểm phải bằng 10.  Hệ thống sẽ tự động kiểm tra khi tạo.
						</Text>
					</Card>
				</Form>
			</Modal>

			{/* Modal gán lớp */}
			<Modal
				title={`Gán bài tập "${selectedAssignment?.title}" vào lớp`}
				open={assignModalOpen}
				onCancel={() => {
					setAssignModalOpen(false);
					setSelectedAssignment(null);
					setTempSelectedSectionIds([]);
				}}
				onOk={handleSaveAssignment}
				okText="Lưu"
				cancelText="Hủy"
				confirmLoading={savingAssignment}
				width={isMobile ? "100%" : 600}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<div className="flex flex-col gap-2">
					{sections.length === 0 ? (
						<p className="text-center text-gray-400">Không có lớp nào</p>
					) : (
						sections.map((s) => {
							const checked = tempSelectedSectionIds.includes(s.id);
							return (
								<label
									key={s.id}
									className={`flex items-center gap-2 cursor-pointer p-3 border rounded transition-all ${checked
											? "bg-blue-50 border-blue-300"
											: "border-gray-200 hover:bg-gray-50"
										}`}
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={(e) => toggleTempSelection(s.id, e.target.checked)}
										className="cursor-pointer"
									/>
									<span>
										{s.sectionCode} - {s.sectionName}
									</span>
								</label>
							);
						})
					)}
				</div>
			</Modal>
		</div>
	);
}