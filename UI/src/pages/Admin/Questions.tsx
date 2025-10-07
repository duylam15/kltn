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
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { BookOpen } from "lucide-react";

const { Title, Text } = Typography;
const { TextArea } = Input;
const API_BASE = "http://localhost:4000/api/v1";

type Choice = {
	id?: number;
	content: string;
	isCorrect: boolean;
	order?: number;
};

type Question = {
	id: number;
	type: string;
	content: string;
	points: number;
	choices?: Choice[];
	createdAt?: string;
	updatedAt?: string;
};

export default function Questions() {
	const [loading, setLoading] = useState(true);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal thêm/sửa
	const [form] = Form.useForm<any>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Question | null>(null);
	const [choices, setChoices] = useState<Choice[]>([
		{ content: "", isCorrect: false, order: 1 },
	]);

	// modal xem chi tiết
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

	useEffect(() => {
		fetchQuestions();
	}, []);

	async function fetchQuestions() {
		try {
			setLoading(true);
			const res = await axios.get<{ success: boolean; data: Question[] }>(
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
				choices: validChoices.map((c, idx) => ({
					content: c.content.trim(),
					isCorrect: c.isCorrect,
					order: idx + 1,
				})),
			};

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

	const columns = [
		{
			title: "Nội dung câu hỏi",
			dataIndex: "content",
			key: "content",
			width: "40%",
			render: (text: string, record: Question) => (
				<div>
					<Text strong style={{ cursor: "pointer" }} onClick={() => viewDetails(record)}>
						{text.length > 100 ? text.substring(0, 100) + "..." : text}
					</Text>
				</div>
			),
		},
		{
			title: "Loại",
			dataIndex: "type",
			key: "type",
			align: "center" as const,
			width: "15%",
			render: (type: string) => (
				<Tag color="blue">
					{type === "multiple_choice" ? "Trắc nghiệm" : type}
				</Tag>
			),
		},
		{
			title: "Điểm",
			dataIndex: "points",
			key: "points",
			align: "center" as const,
			width: "10%",
			sorter: (a: Question, b: Question) => a.points - b.points,
			render: (points: number) => <Tag color="green">{points} điểm</Tag>,
		},
		{
			title: "Số đáp án",
			key: "choicesCount",
			align: "center" as const,
			width: "12%",
			render: (_: any, record: Question) => (
				<Tag color="purple">{record.choices?.length || 0} đáp án</Tag>
			),
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			width: "13%",
			sorter: (a: Question, b: Question) =>
				new Date(a.createdAt || 0).getTime() -
				new Date(b.createdAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			width: "10%",
			render: (_: any, record: Question) => (
				<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
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
							onClick={() => {
								setEditing(record);
								form.setFieldsValue({
									type: record.type,
									content: record.content,
									points: record.points,
								});
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
				</div>
			),
		},
	];

	const filteredQuestions = questions.filter((q) => {
		if (!keyword) return true;
		const kw = keyword.toLowerCase();
		return q.content?.toLowerCase().includes(kw);
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
						<div className="mt-1"><BookOpen /></div> Quản lý Câu hỏi
					</div>
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
				<Input
					allowClear
					prefix={<SearchOutlined />}
					placeholder="Tìm kiếm theo nội dung câu hỏi..."
					value={keyword}
					onChange={(e) => setKeyword(e.target.value)}
					style={{ width: 400 }}
				/>
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
							setModalOpen(true);
						}}
					>
						Thêm câu hỏi
					</Button>
				</div>
			</div>

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
				/>
			)}

			{/* Modal thêm/sửa */}
			<Modal
				title={editing ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					setChoices([{ content: "", isCorrect: false, order: 1 }]);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tạo mới"}
				cancelText="Hủy"
				width={700}
				centered   
				bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}  

			>
				<Form form={form} layout="vertical">
					<Form.Item
						label="Nội dung câu hỏi"
						name="content"
						rules={[{ required: true, message: "Vui lòng nhập nội dung câu hỏi" }]}
					>
						<TextArea
							placeholder="Nhập nội dung câu hỏi..."
							rows={3}
							maxLength={500}
							showCount
						/>
					</Form.Item>

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
										Đáp án đúng
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
				title="Chi tiết câu hỏi"
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
				width={600}
			>
				{selectedQuestion && (
					<div>
						<div style={{ marginBottom: 16 }}>
							<Text strong>Nội dung câu hỏi:</Text>
							<div style={{ marginTop: 8 }}>
								<Text>{selectedQuestion.content}</Text>
							</div>
						</div>

						<div style={{ marginBottom: 16 }}>
							<Text strong>Loại câu hỏi:</Text>{" "}
							<Tag color="blue">
								{selectedQuestion.type === "multiple_choice"
									? "Trắc nghiệm"
									: selectedQuestion.type}
							</Tag>
						</div>

						<div style={{ marginBottom: 16 }}>
							<Text strong>Điểm:</Text>{" "}
							<Tag color="green">{selectedQuestion.points} điểm</Tag>
						</div>

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
							<div>
								Ngày tạo:{" "}
								{selectedQuestion.createdAt
									? dayjs(selectedQuestion.createdAt).format(
										"DD/MM/YYYY HH:mm:ss"
									)
									: "—"}
							</div>
							<div>
								Cập nhật lần cuối:{" "}
								{selectedQuestion.updatedAt
									? dayjs(selectedQuestion.updatedAt).format(
										"DD/MM/YYYY HH:mm:ss"
									)
									: "—"}
							</div>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}