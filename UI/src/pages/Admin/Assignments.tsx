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
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	BookOutlined,
	ApartmentOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FileQuestion } from "lucide-react";

const { Title } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";

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
	difficulty?: string;
	points?: number;
};

export default function Assignments() {
	const [loading, setLoading] = useState(true);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [sections, setSections] = useState<Section[]>([]);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [keyword, setKeyword] = useState("");

	const [form] = Form.useForm<any>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Assignment | null>(null);

	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
	const [assignedSectionIds, setAssignedSectionIds] = useState<number[]>([]);
	const [tempSelectedSectionIds, setTempSelectedSectionIds] = useState<number[]>([]);
	const [savingAssignment, setSavingAssignment] = useState(false);

	// State cho câu hỏi
	const [assignedQuestionIds, setAssignedQuestionIds] = useState<number[]>([]);
	const [tempSelectedQuestionIds, setTempSelectedQuestionIds] = useState<number[]>([]);
	const [loadingQuestions, setLoadingQuestions] = useState(false);
	const [questionKeyword, setQuestionKeyword] = useState("");

	useEffect(() => {
		fetchAssignments();
		fetchSections();
		fetchQuestions();
	}, []);

	async function fetchAssignments() {
		try {
			setLoading(true);
			const res = await axios.get<{ success: boolean; data: Assignment[] }>(
				`${API_BASE}/assignments`
			);
			if (res.data.success) {
				setAssignments(res.data.data || []);
			}
		} catch {
			toast.error("Không tải được danh sách bài tập");
		} finally {
			setLoading(false);
		}
	}

	async function fetchSections() {
		try {
			const res = await axios.get<{ success: boolean; data: Section[] }>(
				`${API_BASE}/course-sections`
			);
			if (res.data.success) {
				setSections(res.data.data || []);
			}
		} catch {
			toast.error("Không tải được danh sách lớp");
		}
	}

	async function fetchQuestions() {
		try {
			const res = await axios.get<{ success: boolean; data: Question[] }>(
				`${API_BASE}/questions`
			);
			if (res.data.success) {
				setQuestions(res.data.data || []);
			}
		} catch {
			toast.error("Không tải được danh sách câu hỏi");
		}
	}

	const handleDelete = async (id: number) => {
		try {
			await axios.delete(`${API_BASE}/assignments/${id}`);
			toast.success("Đã xóa bài tập");
			setAssignments((prev) => prev.filter((a) => a.id !== id));
		} catch {
			toast.error("Không thể xóa bài tập");
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			const payload = {
				// nếu sectionId optional thì chỉ thêm nếu có nhập
				...(values.sectionId ? { sectionId: Number(values.sectionId) } : {}),

				title: values.title.trim(),
				description: values.description?.trim(),
				type: values.type,
				dueDate: values.dueDate ? values.dueDate.toISOString() : null,
				maxScore: Number(values.maxScore || 100),
				passingScore: values.passingScore ? Number(values.passingScore) : null,
				timeLimit: values.timeLimit ? Number(values.timeLimit) : null,
				maxAttempts: values.maxAttempts ? Number(values.maxAttempts) : 1,
				shuffleQuestions: values.shuffleQuestions || false,
				showAnswersAfterSubmit: values.showAnswersAfterSubmit || false,
				allowLateSubmission: values.allowLateSubmission || false,
			};

			let assignmentId: number;

			if (editing) {
				const res = await axios.put(
					`${API_BASE}/assignments/${editing.id}`,
					payload
				);
				assignmentId = editing.id;
				console.log(res);
				toast.success("Đã cập nhật bài tập");
			} else {
				const res = await axios.post(`${API_BASE}/assignments`, payload);
				assignmentId = res.data.data.id;
				toast.success("Đã tạo bài tập mới");
			}

			// Gán câu hỏi
			await saveQuestionAssignments(assignmentId);

			setModalOpen(false);
			setEditing(null);
			form.resetFields();
			setTempSelectedQuestionIds([]);
			setAssignedQuestionIds([]);
			fetchAssignments();
		} catch (err: any) {
			if (err?.errorFields) return;
			toast.error(
				err?.response?.data?.message || "Không thể lưu thông tin bài tập"
			);
		}
	};


	// Lưu gán câu hỏi - chỉ xử lý thay đổi
	const saveQuestionAssignments = async (assignmentId: number) => {
		try {
			// Tìm câu hỏi cần thêm (có trong temp nhưng không có trong assigned ban đầu)
			const toAdd = tempSelectedQuestionIds.filter(
				(id) => !assignedQuestionIds.includes(id)
			);

			// Tìm câu hỏi cần xóa (có trong assigned ban đầu nhưng không có trong temp)
			const toRemove = assignedQuestionIds.filter(
				(id) => !tempSelectedQuestionIds.includes(id)
			);

			// Thực hiện các API call
			const addPromises = toAdd.map((questionId) =>
				axios.post(
					`${API_BASE}/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
				)
			);

			const removePromises = toRemove.map((questionId) =>
				axios.delete(
					`${API_BASE}/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
				)
			);

			await Promise.all([...addPromises, ...removePromises]);

			if (toAdd.length > 0 || toRemove.length > 0) {
				toast.success(`Đã cập nhật câu hỏi (thêm: ${toAdd.length}, xóa: ${toRemove.length})`);
			}
		} catch (error) {
			console.error("Error saving question assignments:", error);
			toast.error("Không thể cập nhật câu hỏi");
			throw error;
		}
	};

	// Mở modal gán lớp
	const openAssignModal = async (assignment: Assignment) => {
		setSelectedAssignment(assignment);
		try {
			const res = await axios.get<{ success: boolean; data: any[] }>(
				`${API_BASE}/sections-assignments/assignments/${assignment.id}/sections`
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

	// Mở modal tạo/sửa và load câu hỏi đã gán
	const openCreateEditModal = async (assignment?: Assignment) => {
		if (assignment) {
			setEditing(assignment);
			form.setFieldsValue({
				...assignment,
				dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
			});

			// Load câu hỏi đã gán từ API
			setLoadingQuestions(true);
			try {
				const res = await axios.get<{
					success: boolean;
					data: Array<{
						assignmentId: number;
						questionId: number;
						question: Question;
					}>
				}>(
					`${API_BASE}/assignments-questions/assignments/${assignment.id}/questions`
				);

				if (res.data.success && res.data.data) {
					// Lấy danh sách questionId từ response
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
			form.resetFields();
			setAssignedQuestionIds([]);
			setTempSelectedQuestionIds([]);
		}
		setModalOpen(true);
	};

	// Toggle checkbox tạm thời cho sections
	const toggleTempSelection = (sectionId: number, checked: boolean) => {
		if (checked) {
			setTempSelectedSectionIds((prev) => [...prev, sectionId]);
		} else {
			setTempSelectedSectionIds((prev) => prev.filter((id) => id !== sectionId));
		}
	};

	// Toggle checkbox tạm thời cho questions
	const toggleTempQuestionSelection = (questionId: number, checked: boolean) => {
		if (checked) {
			setTempSelectedQuestionIds((prev) => [...prev, questionId]);
		} else {
			setTempSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
		}
	};

	// Lưu gán lớp - gọi API
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
				axios.post(`${API_BASE}/sections-assignments/sections/${sectionId}/assignments`, {
					assignmentId: selectedAssignment.id,
				})
			);

			const removePromises = toRemove.map((sectionId) =>
				axios.delete(
					`${API_BASE}/sections-assignments/sections/${sectionId}/assignments/${selectedAssignment.id}`
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

	const columns = [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			key: "title",
			render: (text: string) => <strong>{text}</strong>,
		},
		{
			title: "Loại",
			dataIndex: "type",
			key: "type",
			render: (type: string) => {
				const colors: any = {
					exercise: "blue",
					quiz: "purple",
					project: "orange",
					exam: "red",
				};
				return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
			},
		},
		{
			title: "Điểm tối đa",
			dataIndex: "maxScore",
			key: "maxScore",
			align: "center" as const,
		},
		{
			title: "Hạn nộp",
			dataIndex: "dueDate",
			key: "dueDate",
			render: (v: string) =>
				v ? dayjs(v).format("DD/MM/YYYY HH:mm") : <Tag>Không</Tag>,
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			render: (_: any, record: Assignment) => (
				<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => openCreateEditModal(record)}
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
				</div>
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
		<div className="pl-3 pr-3">
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
			}}>
				<Title level={3} className="mt-2">
					<div className="flex items-center gap-2">
						<FileQuestion /> Quản lý Bài tập
					</div>
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, loại..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 400 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchAssignments}>
						Làm mới
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => openCreateEditModal()}
					>
						Thêm bài tập
					</Button>
				</div>
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách bài tập..." />
				</div>
			) : (
				<Table<Assignment>
					dataSource={filteredAssignments}
					columns={columns}
					rowKey="id"
					bordered
					pagination={{ pageSize: 10, showSizeChanger: true }}
					locale={{ emptyText: "Không có bài tập nào" }}
				/>
			)}

			{/* Modal thêm/sửa - 2 cột */}
			<Modal
				title={editing ? "Sửa thông tin bài tập" : "Thêm bài tập mới"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					setTempSelectedQuestionIds([]);
					setAssignedQuestionIds([]);
					setQuestionKeyword("");
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tạo mới"}
				cancelText="Hủy"
				width={1200}
				centered  
				bodyStyle={{
					maxHeight: "70vh", overflowY: "auto", overflowX: "hidden",
					 }}   
			>

				<Row gutter={24}>
					{/* Cột trái: Thông tin bài tập */}
					<Col span={12}>
						<Title level={5} style={{ marginBottom: 12 }}>Thông tin bài tập</Title>

						{/* Form compact */}
						<Form
							form={form}
							layout="vertical"
							className="[&_.ant-form-item]:mb-3" // ✅ ép margin-bottom chỉ còn ~12px
						>
							<Form.Item
								label="Tiêu đề"
								name="title"
								rules={[{ required: true }]}
								className="mb-3"
							>
								<Input placeholder="VD: Bài tập OOP" className="!py-1.5 !px-2" />
							</Form.Item>

							<Form.Item label="Mô tả" name="description" className="mb-3">
								<Input.TextArea rows={3} placeholder="Mô tả chi tiết bài tập" className="!p-2" />
							</Form.Item>

							<Form.Item
								label="Loại bài tập"
								name="type"
								rules={[{ required: true }]}
								className="mb-3"
							>
								<Select placeholder="Chọn loại bài tập" className="w-full" />
							</Form.Item>

							<Form.Item label="Hạn nộp" name="dueDate" className="mb-3">
								<DatePicker
									showTime
									format="YYYY-MM-DD HH:mm"
									className="w-full"
								/>
							</Form.Item>

							<Divider className="!my-3">Cấu hình</Divider>

							<div className="grid grid-cols-2 gap-4">
								<Form.Item label="Điểm tối đa" name="maxScore" className="mb-3">
									<Input type="number" className="!py-1.5 !px-2" />
								</Form.Item>
								<Form.Item label="Điểm đạt" name="passingScore" className="mb-3">
									<Input type="number" className="!py-1.5 !px-2" />
								</Form.Item>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<Form.Item label="Thời gian (phút)" name="timeLimit" className="mb-3">
									<Input type="number" className="!py-1.5 !px-2" />
								</Form.Item>
								<Form.Item label="Số lần nộp" name="maxAttempts" className="mb-3">
									<Input type="number" className="!py-1.5 !px-2" />
								</Form.Item>
							</div>

							<Form.Item name="shuffleQuestions" valuePropName="checked" className="mb-2">
								<Checkbox>Xáo trộn câu hỏi</Checkbox>
							</Form.Item>
							<Form.Item name="showAnswersAfterSubmit" valuePropName="checked" className="mb-2">
								<Checkbox>Hiện đáp án sau khi nộp</Checkbox>
							</Form.Item>
							<Form.Item name="allowLateSubmission" valuePropName="checked" className="mb-0">
								<Checkbox>Cho phép nộp muộn</Checkbox>
							</Form.Item>
						</Form>

					</Col>

					{/* Cột phải: Danh sách câu hỏi */}
					<Col span={12}>
						<Title level={5}>Câu hỏi</Title>
						<Input
							allowClear
							prefix={<SearchOutlined />}
							placeholder="Tìm câu hỏi..."
							value={questionKeyword}
							onChange={(e) => setQuestionKeyword(e.target.value)}
							style={{ marginBottom: 12 }}
						/>
						<div
							style={{
								maxHeight: 400,
								overflowY: "auto",
								border: "1px solid #d9d9d9",
								borderRadius: 4,
								padding: 12,
							}}
						>
							{loadingQuestions ? (
								<div style={{ textAlign: "center", padding: 20 }}>
									<Spin tip="Đang tải câu hỏi..." />
								</div>
							) : filteredQuestions.length === 0 ? (
								<p style={{ textAlign: "center", color: "#999" }}>Không có câu hỏi nào</p>
							) : (
								filteredQuestions.map((q) => {
									const checked = tempSelectedQuestionIds.includes(q.id);
									return (
										<label
											key={q.id}
											style={{
												display: "block",
												padding: "10px 12px",
												marginBottom: 8,
												borderRadius: 4,
												border: "1px solid #d9d9d9",
												cursor: "pointer",
												transition: "all 0.3s",
												backgroundColor: checked ? "#e6f7ff" : "transparent",
											}}
											onMouseEnter={(e) => {
												if (!checked) e.currentTarget.style.backgroundColor = "#f5f5f5";
											}}
											onMouseLeave={(e) => {
												if (!checked) e.currentTarget.style.backgroundColor = "transparent";
											}}
										>
											<div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
												<input
													type="checkbox"
													checked={checked}
													onChange={(e) => toggleTempQuestionSelection(q.id, e.target.checked)}
													style={{ marginTop: 4, cursor: "pointer" }}
												/>
												<div style={{ flex: 1 }}>
													<div style={{ fontWeight: 500, marginBottom: 4 }}>
														{q.content}
													</div>
													<div style={{ fontSize: 12, color: "#666" }}>
														{q.type && <Tag color="blue">{q.type}</Tag>}
														{q.difficulty && <Tag color="orange">{q.difficulty}</Tag>}
														{q.points && <Tag color="green">{q.points} điểm</Tag>}
													</div>
												</div>
											</div>
										</label>
									);
								})
							)}
						</div>
						<div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
							Đã chọn: {tempSelectedQuestionIds.length} câu hỏi
						</div>
					</Col>
				</Row>
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
				width={600}
			>
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					{sections.length === 0 ? (
						<p style={{ textAlign: "center", color: "#999" }}>Không có lớp nào</p>
					) : (
						sections.map((s) => {
							const checked = tempSelectedSectionIds.includes(s.id);
							return (
								<label
									key={s.id}
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
										cursor: "pointer",
										padding: "8px 12px",
										borderRadius: 4,
										border: "1px solid #d9d9d9",
										transition: "all 0.3s",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "#f5f5f5";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = "transparent";
									}}
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={(e) => toggleTempSelection(s.id, e.target.checked)}
										style={{ cursor: "pointer" }}
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