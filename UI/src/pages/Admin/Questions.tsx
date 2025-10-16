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
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { BookOpen } from "lucide-react";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";

type Choice = {
	id?: number;
	content: string;
	isCorrect: boolean;
	order?: number;
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
	choices?: Choice[];
	subject?: Subject;
	chapter?: Chapter;
	createdAt?: string;
	updatedAt?: string;
};

export default function Questions() {
	const [loading, setLoading] = useState(true);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [keyword, setKeyword] = useState("");

	// Data for filters
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [allChapters, setAllChapters] = useState<Chapter[]>([]); // All chapters for lookup

	// Filter states
	const [filterSubject, setFilterSubject] = useState<number | null>(null);
	const [filterChapter, setFilterChapter] = useState<number | null>(null);
	const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);

	// modal thêm/sửa
	const [form] = Form.useForm<any>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Question | null>(null);
	const [choices, setChoices] = useState<Choice[]>([
		{ content: "", isCorrect: false, order: 1 },
	]);

	// Chapters for selected subject in form
	const [formChapters, setFormChapters] = useState<Chapter[]>([]);
	const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

	// modal xem chi tiết
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

	useEffect(() => {
		fetchQuestions();
		fetchSubjects();
	}, []);

	async function fetchQuestions() {
		try {
			setLoading(true);
			const res = await axios.get<{ success: boolean; data:  Question[]  }>(
				`${API_BASE}/questions`
			);
			if (res.data.success) {
				setQuestions(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách câu hỏi");
		} finally {
			setLoading(false);
		}
	}

	async function fetchSubjects() {
		try {
			const res = await axios.get<{ success: boolean; data: Subject[] }>(
				`${API_BASE}/subjects`
			);
			if (res.data.success) {
				setSubjects(res.data.data || []);

				// Fetch all chapters for all subjects
				const chaptersPromises = res.data.data.map((subject) =>
					axios.get<{ success: boolean; data: { items: Chapter[] } }>(
						`${API_BASE}/chapters?subject_id=${subject.id}`
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
			const res = await axios.get<{ success: boolean; data: Chapter[]  }>(
				`${API_BASE}/chapters?subject_id=${subjectId}`
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

	const handleSubjectChange = async (subjectId: number | null) => {
		setSelectedSubjectId(subjectId);
		form.setFieldValue("chapterId", null); // Reset chapter khi đổi subject

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

	const handleDelete = async (id: number) => {
		try {
			await axios.delete(`${API_BASE}/questions/${id}`);
			toast.success("Đã xóa câu hỏi");
			setQuestions((prev) => prev.filter((q) => q.id !== id));
		} catch (err) {
			toast.error("Không thể xóa câu hỏi");
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			// Validate choices
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

			const payload = {
				type: values.type || "multiple_choice",
				content: values.content.trim(),
				points: values.points || 5,

				subjectId: values.subjectId || undefined,
				chapterId: values.chapterId || undefined,
				tags: values.tags?.trim() || undefined,
				difficulty: values.difficulty || "medium",

				choices: validChoices.map((c, idx) => ({
					content: c.content.trim(),
					isCorrect: c.isCorrect,
					order: idx + 1,
				})),
			};
			console.log("Request body:", payload);

			if (editing) {
				await axios.put(`${API_BASE}/questions/${editing.id}`, payload);
				toast.success("Đã cập nhật câu hỏi");
			} else {
				await axios.post(`${API_BASE}/questions`, payload);
				toast.success("Đã thêm câu hỏi mới");
			}


			setModalOpen(false);
			setEditing(null);
			form.resetFields();
			setChoices([{ content: "", isCorrect: false, order: 1 }]);
			setSelectedSubjectId(null);
			setFormChapters([]);
			fetchQuestions();
		} catch (err: any) {
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

	const viewDetails = (record: Question) => {
		setSelectedQuestion(record);
		setDetailModalOpen(true);
	};

	// Render difficulty tag
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

	const columns = [
		{
			title: "Nội dung câu hỏi",
			dataIndex: "content",
			key: "content",
			width: "30%",
			render: (text: string, record: Question) => (
				<div>
					<Text strong style={{ cursor: "pointer" }} onClick={() => viewDetails(record)}>
						{text.length > 80 ? text.substring(0, 80) + "..." : text}
					</Text>
				</div>
			),
		},
		{
			title: "Môn học",
			key: "subject",
			width: "15%",
			render: (_: any, record: Question) => (
				record.subject ? (
					<div>
						<Tag color="blue" icon={<BookOutlined />}>
							{record.subject.subjectCode}
						</Tag>
						<div style={{ fontSize: 12, color: "#666" }}>
							{record.subject.subjectName}
						</div>
					</div>
				) : (
					<Text type="secondary">—</Text>
				)
			),
		},
		{
			title: "Chương",
			key: "chapter",
			width: "12%",
			render: (_: any, record: Question) => (
				record.chapter ? (
					<Tooltip title={record.chapter.chapterName}>
						<Tag color="purple" icon={<FileTextOutlined />}>
							{record.chapter.chapterCode}
						</Tag>
					</Tooltip>
				) : (
					<Text type="secondary">—</Text>
				)
			),
		},
		{
			title: "Độ khó",
			dataIndex: "difficulty",
			key: "difficulty",
			align: "center" as const,
			width: "10%",
			render: renderDifficultyTag,
		},
		{
			title: "Điểm",
			dataIndex: "points",
			key: "points",
			align: "center" as const,
			width: "8%",
			sorter: (a: Question, b: Question) => a.points - b.points,
			render: (points: number) => <Tag color="green">{points}</Tag>,
		},
		{
			title: "Số đáp án",
			key: "choicesCount",
			align: "center" as const,
			width: "10%",
			render: (_: any, record: Question) => (
				<Tag color="cyan">{record.choices?.length || 0}</Tag>
			),
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			width: "12%",
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			width: "13%",
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
								form.setFieldsValue({
									type: record.type,
									content: record.content,
									points: record.points,
									difficulty: record.difficulty,
									subjectId: record.subjectId,
									chapterId: record.chapterId,
									tags: record.tags,
								});

								// Load chapters if subject is selected
								if (record.subjectId) {
									const chaps = await fetchChaptersBySubject(record.subjectId);
									setFormChapters(chaps);
									setSelectedSubjectId(record.subjectId);
								}

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
								setModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa câu hỏi"
							description="Bạn có chắc muốn xóa câu hỏi này?"
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
		// Filter by keyword
		if (keyword) {
			const kw = keyword.toLowerCase();
			const matchContent = q.content?.toLowerCase().includes(kw);
			const matchSubject = q.subject?.subjectName?.toLowerCase().includes(kw) ||
				q.subject?.subjectCode?.toLowerCase().includes(kw);
			const matchChapter = q.chapter?.chapterName?.toLowerCase().includes(kw) ||
				q.chapter?.chapterCode?.toLowerCase().includes(kw);

			if (!matchContent && !matchSubject && !matchChapter) return false;
		}

		// Filter by subject
		if (filterSubject && q.subjectId !== filterSubject) return false;

		// Filter by chapter
		if (filterChapter && q.chapterId !== filterChapter) return false;

		// Filter by difficulty
		if (filterDifficulty && q.difficulty !== filterDifficulty) return false;

		return true;
	});

	return (
		<div className="pl-3 pr-3">
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: 16,
			}}>
				<Title level={3} className="mt-2">
					<div className="flex items-center gap-2">
						<div className="mt-1"><BookOpen /></div> Quản lý Câu hỏi
					</div>
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
					<Button icon={<ReloadOutlined />} onClick={fetchQuestions}>
						Làm mới
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setEditing(null);
							form.resetFields();
							setChoices([{ content: "", isCorrect: false, order: 1 }]);
							setSelectedSubjectId(null);
							setFormChapters([]);
							setModalOpen(true);
						}}
					>
						Thêm câu hỏi
					</Button>
				</div>
			</div>

			{/* Filters */}
			<Card style={{ marginBottom: 16 }}>
				<Row gutter={16}>
					<Col span={8}>
						<Input
							allowClear
							prefix={<SearchOutlined />}
							placeholder="Tìm kiếm theo nội dung, môn học, chương..."
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
						/>
					</Col>
					<Col span={6}>
						<Select
							allowClear
							placeholder="Lọc theo môn học"
							style={{ width: "100%" }}
							value={filterSubject}
							onChange={handleFilterSubjectChange}
						>
							{subjects.map((s) => (
								<Option key={s.id} value={s.id}>
									{s.subjectCode} - {s.subjectName}
								</Option>
							))}
						</Select>
					</Col>
					<Col span={6}>
						<Select
							allowClear
							placeholder="Lọc theo chương"
							style={{ width: "100%" }}
							value={filterChapter}
							onChange={setFilterChapter}
							disabled={!filterSubject}
						>
							{chapters.map((c) => (
								<Option key={c.id} value={c.id}>
									{c.chapterCode} - {c.chapterName}
								</Option>
							))}
						</Select>
					</Col>
					<Col span={4}>
						<Select
							allowClear
							placeholder="Lọc theo độ khó"
							style={{ width: "100%" }}
							value={filterDifficulty}
							onChange={setFilterDifficulty}
						>
							<Option value="easy">Dễ</Option>
							<Option value="medium">Trung bình</Option>
							<Option value="hard">Khó</Option>
						</Select>
					</Col>
				</Row>
			</Card>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách câu hỏi..." />
				</div>
			) : (
				<Table<Question>
					dataSource={filteredQuestions}
					columns={columns}
					rowKey="id"
					bordered
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Tổng ${total} câu hỏi`,
					}}
					locale={{ emptyText: "Không có câu hỏi nào" }}
					scroll={{ x: 1400 }}
				/>
			)}

			{/* Modal thêm/sửa */}
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
					setSelectedSubjectId(null);
					setFormChapters([]);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu thay đổi" : "Tạo mới"}
				cancelText="Hủy"
				width={800}
				centered
				bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
										String(option?.children || '')
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
							<Form.Item
								label="Chương"
								name="chapterId"
							>
								<Select
									showSearch
									allowClear
									placeholder="Chọn chương (không bắt buộc)"
									disabled={!selectedSubjectId}
									filterOption={(input, option) =>
										String(option?.children || '')
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
								initialValue={5}
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
								initialValue="medium"
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
							<Form.Item
								label="Tags (phân cách bởi dấu phẩy)"
								name="tags"
							>
								<Input placeholder="VD: loop, array, basic" />
							</Form.Item>
						</Col>
					</Row>

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
				</Form>
			</Modal>

			{/* Modal xem chi tiết */}
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
				}}
				footer={[
					<Button key="close" onClick={() => setDetailModalOpen(false)}>
						Đóng
					</Button>,
				]}
				width={700}
			>
				{selectedQuestion && (
					<div>
						{/* Thông tin môn học & chương */}
						{(selectedQuestion.subject || selectedQuestion.chapter) && (
							<Card size="small" style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}>
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
							<div style={{ marginTop: 8, padding: 12, backgroundColor: "#fafafa", borderRadius: 4 }}>
								<Text>{selectedQuestion.content}</Text>
							</div>
						</div>

						<Row gutter={16} style={{ marginBottom: 16 }}>
							<Col span={8}>
								<Text strong>Độ khó:</Text>{" "}
								{renderDifficultyTag(selectedQuestion.difficulty)}
							</Col>
							<Col span={8}>
								<Text strong>Điểm:</Text>{" "}
								<Tag color="green">{selectedQuestion.points} điểm</Tag>
							</Col>
							<Col span={8}>
								<Text strong>Loại:</Text>{" "}
								<Tag color="blue">Trắc nghiệm</Tag>
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
				)}
			</Modal>
		</div>
	);
}