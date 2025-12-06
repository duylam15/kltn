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
	Upload,
	Radio,
	Switch,
	Select,
	Space,
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	EyeOutlined,
	FileOutlined,
	UploadOutlined,
	UserOutlined,
	LinkOutlined,
	ShareAltOutlined,
	LockOutlined,
	GlobalOutlined,
	BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { v4 as uuidv4 } from "uuid";
import instance from "../../utils/axiosInstance";

const { Title } = Typography;
const { Option } = Select;

type User = {
	id: number;
	fullName: string;
	email: string;
	role: string;
};

type Material = {
	id: number;
	title: string;
	description?: string;
	fileName?: string;
	filePath?: string;
	fileType?: string;
	fileSize?: number;
	uploadedBy: number;
	uploadedAt: string;
	updatedAt?: string;
	uploader?: User;
	link?: string; // 🆕 Thêm link
	isPublic?: boolean;
	category?: string;
	subjectId?: number; // 🆕
	chapterId?: number; // 🆕
	subject?: { id: number; name: string }; // 🆕
	chapter?: { id: number; title: string }; // 🆕
};

// 🆕 Types cho Subject và Chapter
type Subject = {
	id: number;
	subjectName: string;
	subjectCode: string;
};

type Chapter = {
	id: number;
	chapterName: string;
	subjectId: number;
};

export default function MaterialsAdmin() {
	const [loading, setLoading] = useState(true);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal thêm/sửa
	const [form] = Form.useForm<any>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Material | null>(null);
	const [file, setFile] = useState<any>(null);
	const [materialType, setMaterialType] = useState<"file" | "link">("file"); // 🆕

	// 🆕 States cho Subjects và Chapters
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [loadingSubjects, setLoadingSubjects] = useState(false);
	const [loadingChapters, setLoadingChapters] = useState(false);
	const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

	const { user } = useAuth();

	useEffect(() => {
		fetchMaterials();
		fetchSubjects(); // 🆕
	}, []);

	// 🆕 Fetch danh sách môn học
	const fetchSubjects = async () => {
		try {
			setLoadingSubjects(true);
			const res = await instance.get(`/subjects`);
			if (res.data.success) {
				setSubjects(res.data.data || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải môn học:", err);
		} finally {
			setLoadingSubjects(false);
		}
	};

	// 🆕 Fetch danh sách chương học theo môn
	const fetchChaptersBySubject = async (subjectId: number) => {
		try {
			setLoadingChapters(true);
			const res = await instance.get(`/chapters? subjectId=${subjectId}`);
			if (res.data.success) {
				setChapters(res.data.data || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải chương học:", err);
			setChapters([]);
		} finally {
			setLoadingChapters(false);
		}
	};

	// 🆕 Xử lý khi chọn môn học
	const handleSubjectChange = (subjectId: number | null) => {
		setSelectedSubjectId(subjectId);
		form.setFieldsValue({ chapterId: undefined });
		if (subjectId) {
			fetchChaptersBySubject(subjectId);
		} else {
			setChapters([]);
		}
	};

	async function fetchMaterials() {
		try {
			setLoading(true);
			const res = await instance.get<{ success: boolean; data: Material[] }>(
				`/materials`
			);
			if (res.data.success) {
				setMaterials(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách tài liệu");
		} finally {
			setLoading(false);
		}
	}

	const handleDelete = async (id: number) => {
		try {
			const res = await instance.delete(`/materials/${id}`);
			if (res.data.success) {
				toast.success("Đã xóa tài liệu");
				setMaterials((prev) => prev.filter((m) => m.id !== id));
			} else {
				toast.error(res.data.message || "Không thể xóa tài liệu");
			}
		} catch (err: any) {
			toast.error("Không thể xóa tài liệu (có thể đã được gán vào lớp)");
		}
	};

	const handleView = (material: Material) => {
		if (material.link) {
			// 🆕 Xem link
			window.open(material.link, "_blank");
		} else if (material.filePath) {
			window.open(`${import.meta.env.VITE_API_URL}/${material.filePath}`, "_blank");
		} else {
			toast.error("Tài liệu này chưa có nội dung để xem");
		}
	};

	// 🆕 Hàm xử lý thêm/sửa tài liệu
	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			if (editing) {
				// Cập nhật tài liệu (chỉ cập nhật metadata)
				await instance.put(`/materials/${editing.id}`, {
					title: values.title.trim(),
					description: values.description?.trim() || "",
					isPublic: values.isPublic || false,
					category: values.category || "other",
					link: values.link?.trim() || undefined, // 🆕 Cập nhật link nếu có
					subjectId: values.subjectId || undefined,
					chapterId: values.chapterId || undefined,
				});
				toast.success("Đã cập nhật tài liệu");
			} else {
				// Thêm tài liệu mới
				if (materialType === "file") {
					// Upload file
					if (!file) {
						toast.error("Vui lòng chọn file");
						return;
					}
					const uniqueCode = uuidv4();

					const formData = new FormData();
					formData.append("file", file);
					formData.append("title", values.title.trim());
					formData.append("description", values.description?.trim() || "");
					formData.append("uploadedBy", user?.id.toString() || "0");
					formData.append("originalMaterialId", uniqueCode);
					formData.append("isPublic", values.isPublic ? "true" : "false");
					formData.append("category", values.category || "other");

					if (values.subjectId) {
						formData.append("subjectId", String(values.subjectId));
					}
					if (values.chapterId) {
						formData.append("chapterId", String(values.chapterId));
					}

					await instance.post(`/materials/upload`, formData, {
						headers: { "Content-Type": "multipart/form-data" },
					});
					toast.success("Đã thêm tài liệu mới");
				} else {
					// 🆕 Thêm tài liệu từ link
					if (!values.link || values.link.trim() === "") {
						toast.error("Vui lòng nhập link tài liệu");
						return;
					}

					await instance.post(`/materials/create-from-link`, {
						title: values.title.trim(),
						description: values.description?.trim() || "",
						link: values.link.trim(),
						category: values.category || "other",
						isPublic: values.isPublic || false,
						uploadedBy: user?.id || 0,
						subjectId: values.subjectId || undefined,
						chapterId: values.chapterId || undefined,
					});

					toast.success("Đã thêm tài liệu từ link");
				}
			}

			setModalOpen(false);
			setEditing(null);
			setFile(null);
			setMaterialType("file");
			setSelectedSubjectId(null);
			setChapters([]);
			form.resetFields();
			fetchMaterials();
		} catch (err: any) {
			if (err?.errorFields) return;
			const errorMsg = err?.response?.data?.message || "Không thể lưu tài liệu";
			toast.error(errorMsg);
		}
	};

	const getFileTypeTag = (fileType?: string, link?: string) => {
		if (link) {
			return <Tag icon={<LinkOutlined />} color="cyan">LINK</Tag>;
		}

		const type = fileType?.toLowerCase();
		if (type?.includes("pdf")) return <Tag color="red">PDF</Tag>;
		if (type?.includes("word") || type?.includes("doc")) return <Tag color="blue">DOC</Tag>;
		if (type?.includes("excel") || type?.includes("sheet")) return <Tag color="green">XLS</Tag>;
		if (type?.includes("powerpoint") || type?.includes("presentation")) return <Tag color="orange">PPT</Tag>;
		if (type?.includes("image")) return <Tag color="purple">IMG</Tag>;
		return <Tag color="default">{fileType || "FILE"}</Tag>;
	};

	const formatFileSize = (size?: number) => {
		if (!size) return "—";
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	};

	const columns = [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			key: "title",
			width: 250,
			ellipsis: { showTitle: false },
			sorter: (a: Material, b: Material) => a.title.localeCompare(b.title),
			render: (text: string, record: Material) => (
				<div>
					<Tooltip title={text} placement="topLeft">
						<div style={{ fontWeight: 600, color: "#1890ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
							{record.link ? <LinkOutlined style={{ marginRight: 8 }} /> : <FileOutlined style={{ marginRight: 8 }} />}
							{text}
						</div>
					</Tooltip>
					{record.description && (
						<div style={{ fontSize: 12, color: "#666", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
							{record.description}
						</div>
					)}
					{/* 🆕 Hiển thị môn học và chương */}
					{(record.subject || record.chapter) && (
						<div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
							{record.subject && (
								<Tag icon={<BookOutlined />} color="blue" style={{ fontSize: 11 }}>
									{record.subject.name}
								</Tag>
							)}
							{record.chapter && (
								<Tag color="purple" style={{ fontSize: 11 }}>
									{record.chapter.title}
								</Tag>
							)}
						</div>
					)}
				</div>
			),
		},
		{
			title: "Mô tả",
			dataIndex: "description",
			key: "description",
			width: 180,
			ellipsis: { showTitle: false },
			render: (text: string) => (
				<Tooltip title={text} placement="topLeft">
					<div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
						{text || <Tag color="default">Không có mô tả</Tag>}
					</div>
				</Tooltip>
			),
		},
		{
			title: "File/Link",
			key: "fileInfo",
			width: 200,
			render: (_: any, record: Material) => (
				<div>
					{record.link ? (
						<Tooltip title={record.link}>
							<div style={{ fontSize: 12, color: "#1890ff", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
								{record.link}
							</div>
						</Tooltip>
					) : (
						<Tooltip title={record.fileName}>
							<div style={{ fontSize: 12, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
								{record.fileName || <Tag color="red">Chưa có file</Tag>}
							</div>
						</Tooltip>
					)}
					<Space size={4}>
						{getFileTypeTag(record.fileType, record.link)}
						{record.fileSize && <Tag color="default">{formatFileSize(record.fileSize)}</Tag>}
					</Space>
				</div>
			),
		},
		{
			title: "Trạng thái",
			key: "isPublic",
			width: 100,
			align: "center" as const,
			render: (_: any, record: Material) => (
				record.isPublic ? (
					<Tag icon={<GlobalOutlined />} color="success">Công khai</Tag>
				) : (
					<Tag icon={<LockOutlined />} color="default">Riêng tư</Tag>
				)
			),
		},
		{
			title: "Người tải lên",
			key: "uploader",
			width: 180,
			sorter: (a: Material, b: Material) =>
				(a.uploader?.fullName || "").localeCompare(b.uploader?.fullName || ""),
			render: (_: any, record: Material) => (
				<div>
					<Tooltip title={record.uploader?.fullName} placement="topLeft">
						<div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
							<UserOutlined style={{ marginRight: 6 }} />
							{record.uploader?.fullName || "Không xác định"}
						</div>
					</Tooltip>
					{record.uploader?.email && (
						<div style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
							{record.uploader.email}
						</div>
					)}
				</div>
			),
		},
		{
			title: "Ngày tải lên",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: 130,
			sorter: (a: Material, b: Material) =>
				new Date(a.uploadedAt || 0).getTime() -
				new Date(b.uploadedAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 140,
			align: "center" as const,
			fixed: "right" as const,
			render: (_: any, record: Material) => (
				<Space size={4}>
					<Tooltip title="Xem">
						<Button
							icon={<EyeOutlined />}
							size="small"
							onClick={() => handleView(record)}
							disabled={!record.filePath && !record.link}
						/>
					</Tooltip>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => {
								setEditing(record);
								setMaterialType(record.link ? "link" : "file");
								setSelectedSubjectId(record.subjectId || null);
								if (record.subjectId) {
									fetchChaptersBySubject(record.subjectId);
								}
								form.setFieldsValue({
									title: record.title,
									description: record.description,
									isPublic: record.isPublic || false,
									category: record.category || "other",
									link: record.link || "",
									subjectId: record.subjectId || undefined,
									chapterId: record.chapterId || undefined,
								});
								setModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa tài liệu"
							description="Bạn có chắc muốn xóa tài liệu này?"
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

	const filteredMaterials = materials.filter((m) => {
		if (!keyword) return true;
		const kw = keyword.toLowerCase();
		return (
			m.title?.toLowerCase().includes(kw) ||
			m.description?.toLowerCase().includes(kw) ||
			m.fileName?.toLowerCase().includes(kw) ||
			m.link?.toLowerCase().includes(kw) ||
			m.uploader?.fullName?.toLowerCase().includes(kw) ||
			m.uploader?.email?.toLowerCase().includes(kw)
		);
	});

	return (
		<div className="materials-admin-container" style={{ padding: "8px 12px" }}>
			<style>
				{`
					@media (max-width: 768px) {
						.materials-admin-title {
							font-size: 18px !important;
							margin-bottom: 8px ! important;
						}

						.header-actions-admin {
							flex-direction: column !important;
							gap: 8px !important;
							width: 100%;
						}

						.header-actions-admin .ant-input,
						.header-actions-admin .ant-btn {
							width: 100% !important;
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
				`}
			</style>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
				<Title level={3} className="materials-admin-title" style={{ margin: 0 }}>
					<div className="flex items-center gap-2">
						<FileText size={20} /> Quản lý Tài liệu
					</div>
				</Title>
				<div className="header-actions-admin" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, tên file..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 300 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchMaterials}>
						Làm mới
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setEditing(null);
							setFile(null);
							setMaterialType("file");
							setSelectedSubjectId(null);
							setChapters([]);
							form.resetFields();
							setModalOpen(true);
						}}
					>
						Thêm tài liệu
					</Button>
				</div>
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách tài liệu..." />
				</div>
			) : (
				<Table<Material>
					dataSource={filteredMaterials}
					columns={columns}
					rowKey="id"
					bordered
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Tổng ${total} tài liệu`,
						responsive: true,
					}}
					locale={{ emptyText: "Không có tài liệu nào" }}
					scroll={{ x: 1200 }}
					size="middle"
				/>
			)}

			{/* 🆕 Modal thêm/sửa tài liệu */}
			<Modal
				title={editing ? "Sửa thông tin tài liệu" : "Thêm tài liệu mới"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					setFile(null);
					setMaterialType("file");
					setSelectedSubjectId(null);
					setChapters([]);
					form.resetFields();
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Thêm"}
				cancelText="Hủy"
				width={600}
				centered
				style={{ maxWidth: "calc(100vw - 16px)" }}
				bodyStyle={{
					maxHeight: "75vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
					{/* 🆕 Radio chọn loại tài liệu (chỉ hiện khi thêm mới) */}
					{!editing && (
						<Form.Item label="Loại tài liệu">
							<Radio.Group
								value={materialType}
								onChange={(e) => {
									setMaterialType(e.target.value);
									setFile(null);
								}}
								buttonStyle="solid"
							>
								<Radio.Button value="file">
									<FileOutlined /> Upload File
								</Radio.Button>
								<Radio.Button value="link">
									<LinkOutlined /> Thêm Link
								</Radio.Button>
							</Radio.Group>
						</Form.Item>
					)}

					<Form.Item
						label="Tiêu đề tài liệu"
						name="title"
						rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
					>
						<Input placeholder="VD: Bài giảng chương 1" maxLength={200} />
					</Form.Item>

					<Form.Item label="Mô tả" name="description">
						<Input.TextArea
							rows={3}
							placeholder="Nhập mô tả chi tiết về tài liệu"
							maxLength={500}
						/>
					</Form.Item>

					{/* 🆕 Loại tài liệu */}
					<Form.Item name="category" label="Phân loại">
						<Select placeholder="Chọn loại tài liệu">
							<Option value="lecture">Bài giảng</Option>
							<Option value="slide">Slide</Option>
							<Option value="exercise">Bài tập</Option>
							<Option value="reference">Tài liệu tham khảo</Option>
							<Option value="syllabus">Đề cương</Option>
							<Option value="other">Khác</Option>
						</Select>
					</Form.Item>

					{/* 🆕 Chọn môn học */}
					<Form.Item name="subjectId" label="Môn học (tùy chọn)">
						<Select
							allowClear
							showSearch
							placeholder="Chọn môn học"
							loading={loadingSubjects}
							onChange={handleSubjectChange}
							filterOption={(input, option) =>
								String(option?.children || "")
									.toLowerCase()
									.includes(input.toLowerCase())
							}
						>
							{subjects.map((subject) => (
								<Option key={subject.id} value={subject.id}>
									{subject.subjectCode} - {subject.subjectName}
								</Option>
							))}
						</Select>
					</Form.Item>

					{/* 🆕 Chọn chương học */}
					{selectedSubjectId && (
						<Form.Item name="chapterId" label="Chương học (tùy chọn)">
							<Select
								allowClear
								showSearch
								placeholder="Chọn chương học"
								loading={loadingChapters}
								disabled={!selectedSubjectId}
								filterOption={(input, option) =>
									String(option?.children || "")
										.toLowerCase()
										.includes(input.toLowerCase())
								}
							>
								{chapters.map((chapter) => (
									<Option key={chapter.id} value={chapter.id}>
										{chapter.chapterName}
									</Option>
								))}
							</Select>
						</Form.Item>
					)}

					{/* 🆕 Hiển thị Upload hoặc Input Link */}
					{materialType === "file" || editing?.fileName ? (
						<>
							{editing && editing.fileName && (
								<Form.Item label="File hiện tại">
									<div
										style={{
											padding: 8,
											backgroundColor: "#f5f5f5",
											borderRadius: 6,
											display: "flex",
											alignItems: "center",
											gap: 8,
											flexWrap: "wrap",
										}}
									>
										<FileOutlined />
										<span>{editing.fileName}</span>
										{editing.fileSize && (
											<Tag color="default">{formatFileSize(editing.fileSize)}</Tag>
										)}
									</div>
								</Form.Item>
							)}

							{!editing && (
								<Form.Item
									label="Chọn file"
									rules={[{ required: true, message: "Vui lòng chọn file" }]}
								>
									<Upload
										beforeUpload={(f) => {
											setFile(f);
											return false;
										}}
										maxCount={1}
										onRemove={() => setFile(null)}
										fileList={
											file
												? [{ uid: "1", name: file.name, status: "done" as const }]
												: []
										}
									>
										<Button icon={<UploadOutlined />}>
											{file ? "Đã chọn file" : "Chọn file"}
										</Button>
									</Upload>
									{file && (
										<div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
											File đã chọn: {file.name} ({formatFileSize(file.size)})
										</div>
									)}
								</Form.Item>
							)}
						</>
					) : (
						<Form.Item
							name="link"
							label="Link tài liệu"
							rules={[
								{ required: true, message: "Vui lòng nhập link" },
								{ type: "url", message: "Link không hợp lệ" },
							]}
						>
							<Input
								prefix={<LinkOutlined />}
								placeholder="https://example.com/tai-lieu"
							/>
						</Form.Item>
					)}

					{/* 🆕 Chia sẻ công khai */}
					<Form.Item
						name="isPublic"
						label="Chia sẻ tài liệu"
						valuePropName="checked"
						initialValue={false}
						tooltip="Khi bật, giảng viên khác có thể xem và sử dụng tài liệu này"
					>
						<Switch
							checkedChildren={
								<>
									<ShareAltOutlined /> Công khai
								</>
							}
							unCheckedChildren={
								<>
									<LockOutlined /> Riêng tư
								</>
							}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}