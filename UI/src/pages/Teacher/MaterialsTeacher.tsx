import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	Switch,
	Tag,
	Modal,
	Form,
	Input,
	Upload,
	Popconfirm,
	Tooltip,
	Select,
	Radio,
	Space,
} from "antd";
import {
	UploadOutlined,
	PlusOutlined,
	EyeOutlined,
	EditOutlined,
	DeleteOutlined,
	ReloadOutlined,
	SearchOutlined,
	FileOutlined,
	ShareAltOutlined,
	GlobalOutlined,
	LockOutlined,
	CloudUploadOutlined,
	FolderOpenOutlined,
	CheckCircleOutlined,
	DatabaseOutlined,
	LinkOutlined,
	BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../context/authContext";
import { FileText } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";

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
	isPublic: boolean;
	uploader?: {
		id: number;
		fullName: string;
		email: string;
	};
	originalMaterialId?: string;
	category?: string;
	link?: string;
	subjectId?: number; // 🆕
	chapterId?: number; // 🆕
	subject?: { id: number; name: string }; // 🆕
	chapter?: { id: number; title: string }; // 🆕
};

type Section = {
	id: number;
	sectionCode: string;
	sectionName: string;
	subject: {
		subjectCode: string;
		subjectName: string;
	};
	term: {
		name: string;
	};
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

export default function MaterialsTeacher() {
	const { user } = useAuth();
	const userId = user?.id;
	const teacherId = user?.teacher?.id;

	const [loading, setLoading] = useState(true);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [mySections, setMySections] = useState<Section[]>([]);
	const [keyword, setKeyword] = useState("");
	const [filterPublic, setFilterPublic] = useState<boolean | null>(null);

	// 🆕 States cho Subjects và Chapters
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [loadingSubjects, setLoadingSubjects] = useState(false);
	const [loadingChapters, setLoadingChapters] = useState(false);
	const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

	// Modal states
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [libraryModalOpen, setLibraryModalOpen] = useState(false);

	const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
	const [assigningMaterial, setAssigningMaterial] = useState<Material | null>(null);
	const [file, setFile] = useState<any>(null);

	const [materialType, setMaterialType] = useState<"file" | "link">("file");

	const [form] = Form.useForm();
	const [addForm] = Form.useForm();
	const [assignForm] = Form.useForm();
	const [libraryForm] = Form.useForm();

	// Library states
	const [allMaterials, setAllMaterials] = useState<Material[]>([]);
	const [loadingLibrary, setLoadingLibrary] = useState(false);
	const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
	const [libraryKeyword, setLibraryKeyword] = useState("");

	useEffect(() => {
		if (userId) {
			fetchData();
			fetchMySections();
			fetchSubjects(); // 🆕 Load subjects khi component mount
		}
	}, [userId]);

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
		addForm.setFieldsValue({ chapterId: undefined }); // Reset chapter
		if (subjectId) {
			fetchChaptersBySubject(subjectId);
		} else {
			setChapters([]);
		}
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await instance.get(`/materials/teacher/${userId}`);
			if (res.data.success) {
				setMaterials(res.data.data || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải dữ liệu:", err);
			toast.error("Không tải được danh sách tài liệu");
		} finally {
			setLoading(false);
		}
	};

	const fetchMySections = async () => {
		try {
			const res = await instance.get(
				`/sections-instructors?teacher_id=${teacherId}`
			);
			if (res.data.success) {
				setMySections(res.data.data.map((item: any) => item.section) || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải lớp học:", err);
		}
	};

	const fetchAllMaterials = async () => {
		try {
			setLoadingLibrary(true);
			const { data } = await instance.get(`/materials/public`, {
				params: {
					userId,
					page: 1,
					size: 100,
					keyword: libraryKeyword,
				},
			});

			if (data?.success) {
				setAllMaterials(data.data || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải thư viện:", err);
			toast.error("Không tải được danh sách tài liệu chung");
		} finally {
			setLoadingLibrary(false);
		}
	};

	const handleAssignFromLibrary = async () => {
		try {
			const values = await libraryForm.validateFields();

			if (selectedMaterialIds.length === 0) {
				toast.error("Vui lòng chọn ít nhất 1 tài liệu");
				return;
			}

			let successCount = 0;
			let errorCount = 0;

			for (const materialId of selectedMaterialIds) {
				try {
					await instance.post(`/materials/assign`, {
						courseSectionId: values.sectionId,
						materialId,
						assignedBy: userId,
					});
					successCount++;
				} catch (err: any) {
					errorCount++;
					console.error(`Lỗi gán material ${materialId}:`, err);
				}
			}

			if (successCount > 0) {
				toast.success(`Đã thêm ${successCount} tài liệu vào lớp`);
			}
			if (errorCount > 0) {
				toast.error(`${errorCount} tài liệu không thể thêm (có thể đã tồn tại)`);
			}

			setLibraryModalOpen(false);
			setSelectedMaterialIds([]);
			setLibraryKeyword("");
			libraryForm.resetFields();
		} catch (err: any) {
			if (err?.errorFields) return;
			console.error("Lỗi assign from library:", err);
			toast.error("Không thể thêm tài liệu vào lớp");
		}
	};

	const handleTogglePublic = async (materialId: number, isPublic: boolean) => {
		try {
			const res = await instance.put(`/materials/${materialId}`, {
				isPublic,
			});
			if (res.data.success) {
				toast.success(`Đã ${isPublic ? "chia sẻ" : "hủy chia sẻ"} tài liệu`);
				setMaterials((prev) =>
					prev.map((m) => (m.id === materialId ? { ...m, isPublic } : m))
				);
			}
		} catch (err: any) {
			console.error("Lỗi toggle public:", err);
			toast.error("Không thể cập nhật trạng thái chia sẻ");
		}
	};

	// 🆕 Hàm xử lý thêm tài liệu (đã cập nhật để gửi subjectId, chapterId)
	const handleAdd = async () => {
		try {
			const values = await addForm.validateFields();

			// Kiểm tra loại tài liệu
			if (materialType === "file") {
				// Upload file
				if (!file) {
					toast.error("Vui lòng chọn file");
					return;
				}

				const formData = new FormData();
				formData.append("file", file);
				formData.append("title", values.title);
				formData.append("description", values.description || "");
				formData.append("isPublic", values.isPublic ? "true" : "false");
				formData.append("uploadedBy", String(userId));
				formData.append("category", values.category || "other");
				formData.append("originalMaterialId", uuidv4());

				// 🆕 Thêm subjectId và chapterId
				if (values.subjectId) {
					formData.append("subjectId", String(values.subjectId));
				}
				if (values.chapterId) {
					formData.append("chapterId", String(values.chapterId));
				}

				await instance.post(`/materials/upload`, formData, {
					headers: { "Content-Type": "multipart/form-data" },
				});

				toast.success("Thêm tài liệu thành công");
			} else {
				// Thêm link
				if (!values.link || values.link.trim() === "") {
					toast.error("Vui lòng nhập link tài liệu");
					return;
				}

				await instance.post(`/materials/create-from-link`, {
					title: values.title,
					description: values.description || "",
					link: values.link.trim(),
					category: values.category || "other",
					isPublic: values.isPublic || false,
					uploadedBy: userId,
					subjectId: values.subjectId || undefined, // 🆕
					chapterId: values.chapterId || undefined, // 🆕
				});

				toast.success("Thêm tài liệu từ link thành công");
			}

			setAddModalOpen(false);
			setFile(null);
			setMaterialType("file");
			setSelectedSubjectId(null);
			setChapters([]);
			addForm.resetFields();
			fetchData();
		} catch (err: any) {
			if (err?.errorFields) return;
			console.error("Lỗi add:", err);
			toast.error(err.response?.data?.message || "Không thể thêm tài liệu");
		}
	};

	const handleUpdate = async () => {
		try {
			const values = await form.validateFields();
			if (!editingMaterial) return;

			await instance.put(`/materials/${editingMaterial.id}`, values);
			toast.success("Cập nhật tài liệu thành công");
			setEditModalOpen(false);
			setEditingMaterial(null);
			fetchData();
		} catch (err: any) {
			if (err?.errorFields) return;
			console.error("Lỗi update:", err);
			toast.error("Không thể cập nhật tài liệu");
		}
	};

	const handleDelete = async (id: number) => {
		try {
			const res = await instance.delete(`/materials/${id}`);
			if (res.data.success) {
				toast.success("Xóa tài liệu thành công");
				setMaterials((prev) => prev.filter((m) => m.id !== id));
			}
		} catch (err: any) {
			console.error("Lỗi delete:", err);
			toast.error(
				err.response?.data?.message ||
				"Không thể xóa tài liệu (có thể đã được gán vào lớp)"
			);
		}
	};

	const handleAssignToClass = async () => {
		try {
			const values = await assignForm.validateFields();
			if (!assigningMaterial) return;

			await instance.post(`/materials/assign`, {
				courseSectionId: values.sectionId,
				materialId: assigningMaterial.id,
				assignedBy: userId,
			});

			toast.success("Đã thêm tài liệu vào lớp");
			setAssignModalOpen(false);
			setAssigningMaterial(null);
			assignForm.resetFields();
		} catch (err: any) {
			console.error("Lỗi assign:", err);
			toast.error(err.response?.data?.message || "Không thể thêm vào lớp");
		}
	};

	const handleView = (material: Material) => {
		if (material.link) {
			window.open(material.link, "_blank");
		} else if (material.filePath) {
			window.open(`http://localhost:4000/${material.filePath}`, "_blank");
		} else {
			toast.error("Tài liệu này chưa có nội dung để xem");
		}
	};

	const getFileTypeTag = (fileType: string, link?: string) => {
		if (link) {
			return <Tag icon={<LinkOutlined />} color="cyan">LINK</Tag>;
		}

		const type = fileType?.toLowerCase();
		if (type?.includes("pdf")) return <Tag color="red">PDF</Tag>;
		if (type?.includes("word") || type?.includes("doc"))
			return <Tag color="blue">DOC</Tag>;
		if (type?.includes("excel") || type?.includes("sheet"))
			return <Tag color="green">XLS</Tag>;
		if (type?.includes("powerpoint") || type?.includes("presentation"))
			return <Tag color="orange">PPT</Tag>;
		if (type?.includes("image")) return <Tag color="purple">IMG</Tag>;
		return <Tag color="default">{fileType || "FILE"}</Tag>;
	};

	const formatFileSize = (size: number) => {
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
			sorter: (a: Material, b: Material) => a.title.localeCompare(b.title),
			render: (text: string, record: Material) => (
				<div>
					<div style={{ fontWeight: 600, color: "#1890ff", fontSize: 14 }}>
						{record.link ? <LinkOutlined style={{ marginRight: 8 }} /> : <FileOutlined style={{ marginRight: 8 }} />}
						{text}
					</div>
					{record.description && (
						<div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
							{record.description.length > 50
								? record.description.substring(0, 50) + "..."
								: record.description}
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
			title: "File/Link",
			key: "fileInfo",
			width: 180,
			render: (_: any, record: Material) => (
				<div>
					{record.link ? (
						<div style={{ marginBottom: 4 }}>
							<Tooltip title={record.link}>
								<span style={{ fontSize: 12, color: "#1890ff", cursor: "pointer" }}>
									{record.link.length > 30
										? record.link.substring(0, 30) + "..."
										: record.link}
								</span>
							</Tooltip>
						</div>
					) : (
						<div style={{ marginBottom: 4 }}>
							{record.fileName ? (
								<Tooltip title={record.fileName}>
									<span style={{ fontSize: 12, color: "#666" }}>
										{record.fileName.length > 25
											? record.fileName.substring(0, 25) + "..."
											: record.fileName}
									</span>
								</Tooltip>
							) : (
								<Tag color="red">Chưa có file</Tag>
							)}
						</div>
					)}
					<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
						{getFileTypeTag(record.fileType || "", record.link)}
						{record.fileSize && (
							<Tag color="default" style={{ margin: 0, fontSize: 11 }}>
								{formatFileSize(record.fileSize)}
							</Tag>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Trạng thái",
			key: "status",
			width: 110,
			align: "center" as const,
			render: (_: any, record: Material) => (
				<Switch
					checkedChildren={<GlobalOutlined />}
					unCheckedChildren={<LockOutlined />}
					checked={record.isPublic}
					onChange={(checked) => handleTogglePublic(record.id, checked)}
					size="small"
				/>
			),
		},
		{
			title: "Ngày tải",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: 110,
			sorter: (a: Material, b: Material) =>
				new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
			render: (date: string) => (
				<span style={{ fontSize: 12 }}>{dayjs(date).format("DD/MM/YYYY")}</span>
			),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 180,
			align: "center" as const,
			render: (_: any, record: Material) => (
				<div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
					<Tooltip title="Xem">
						<Button
							size="small"
							icon={<EyeOutlined />}
							onClick={() => handleView(record)}
							disabled={!record.filePath && !record.link}
						/>
					</Tooltip>
					<Tooltip title="Thêm vào lớp">
						<Button
							size="small"
							icon={<CloudUploadOutlined />}
							onClick={() => {
								setAssigningMaterial(record);
								assignForm.resetFields();
								setAssignModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Sửa">
						<Button
							size="small"
							icon={<EditOutlined />}
							onClick={() => {
								setEditingMaterial(record);
								form.setFieldsValue(record);
								setEditModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa tài liệu"
							description="Bạn có chắc muốn xóa?"
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

	const filteredMaterials = materials.filter((m) => {
		const matchKeyword =
			!keyword ||
			m.title.toLowerCase().includes(keyword.toLowerCase()) ||
			m.description?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.fileName?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.link?.toLowerCase().includes(keyword.toLowerCase());

		const matchPublic = filterPublic === null || m.isPublic === filterPublic;

		return matchKeyword && matchPublic;
	});

	const getStatistics = () => {
		const totalMaterials = materials.length;
		const publicMaterials = materials.filter((m) => m.isPublic).length;
		const privateMaterials = totalMaterials - publicMaterials;
		const totalFileSize = materials.reduce(
			(sum, m) => sum + (m.fileSize || 0),
			0
		);

		return {
			totalMaterials,
			publicMaterials,
			privateMaterials,
			totalFileSize,
		};
	};

	const stats = getStatistics();

	if (loading)
		return (
			<div style={{ textAlign: "center", padding: 60 }}>
				<Spin size="large" tip="Đang tải..." />
			</div>
		);

	return (
		<div className="materials-container" style={{ padding: "8px 12px" }}>
			<style>
				{`
					/* Mobile styles */
					@media (max-width: 768px) {
						.materials-title {
							font-size: 18px !important;
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
							width: 100% !important;
						}

						.header-actions . ant-input,
						.header-actions .ant-select,
						.header-actions .ant-btn {
							width: 100% !important;
						}

						.ant-modal {
							max-width: calc(100vw - 16px) !important;
							margin: 8px !important;
						}
						
						/* Table scroll hint */
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

					/* Tablet styles */
					@media (min-width: 769px) and (max-width: 1024px) {
						.stats-container > div:nth-child(n+4) {
							display: none ! important;
						}

						. header-actions . ant-input {
							width: 200px !important;
						}

						.header-actions .ant-select {
							width: 130px !important;
						}
					}

					/* Desktop optimizations */
					@media (min-width: 1025px) {
						.materials-container {
							padding: 16px !important;
						}
					}
					
					/* Table scrollbar styling */
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
			<Title level={3} className="materials-title" style={{ margin: 0, marginBottom: 16 }}>
				<div className="flex items-center gap-2">
					<FileText size={20} /> Quản lý Tài liệu
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
					className="stats-container"
					style={{
						display: "flex",
						gap: 8,
						flexWrap: "wrap",
						flex: "1 1 auto",
					}}
				>
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
						<span>Tổng tài liệu:</span>
						<strong>{stats.totalMaterials}</strong>
					</div>
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
						<DatabaseOutlined style={{ fontSize: 14, color: "#722ed1" }} />
						<span>Dung lượng:</span>
						<strong style={{ color: "#722ed1" }}>
							{formatFileSize(stats.totalFileSize)}
						</strong>
					</div>
				</div>

				{/* Filters + Actions */}
				<div
					className="header-actions"
					style={{
						display: "flex",
						gap: 8,
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
						<Input
							allowClear
							prefix={<SearchOutlined />}
							placeholder="Tìm tài liệu..."
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							style={{ width: 200 }}
						/>

						<Select
							allowClear
							placeholder="Trạng thái"
							style={{ width: 100 }}
							value={filterPublic}
							onChange={setFilterPublic}
						>
							<Option value={true}>Công khai</Option>
							<Option value={false}>Riêng tư</Option>
						</Select>
					</div>

					<div style={{ display: "flex", gap: 8 }}>
						<Button icon={<ReloadOutlined />} onClick={fetchData}>
							<span className="btn-text">Làm mới</span>
						</Button>

						<Button
							icon={<GlobalOutlined />}
							onClick={() => {
								setLibraryModalOpen(true);
								setLibraryKeyword("");
								libraryForm.resetFields();
								fetchAllMaterials();
							}}
						>
							<span className="btn-text">Thư viện</span>
						</Button>

						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => {
								addForm.resetFields();
								setFile(null);
								setMaterialType("file");
								setSelectedSubjectId(null);
								setChapters([]);
								setAddModalOpen(true);
							}}
						>
							<span className="btn-text">Thêm</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Table with horizontal scroll */}
			<div style={{ overflowX: "auto" }}>
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
						size: "default",
					}}
					scroll={{ x: 830 }}
					size="middle"
				/>
			</div>

			{/* 🆕 Modal Thêm tài liệu (đã cập nhật) */}
			<Modal
				title="Thêm tài liệu mới"
				open={addModalOpen}
				onCancel={() => {
					setAddModalOpen(false);
					setFile(null);
					setMaterialType("file");
					setSelectedSubjectId(null);
					setChapters([]);
					addForm.resetFields();
				}}
				onOk={handleAdd}
				okText="Thêm tài liệu"
				cancelText="Hủy"
				width={600}
				style={{ maxWidth: "calc(100vw - 16px)" }}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
					{/* Radio chọn loại tài liệu */}
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

					<Form.Item
						name="title"
						label="Tiêu đề"
						rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
					>
						<Input placeholder="Nhập tiêu đề tài liệu" />
					</Form.Item>

					<Form.Item name="description" label="Mô tả">
						<Input.TextArea
							rows={3}
							placeholder="Nhập mô tả chi tiết về tài liệu"
						/>
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

					{/* 🆕 Chọn chương học (chỉ hiện khi đã chọn môn) */}
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

					{/* Hiển thị Upload hoặc Input Link tùy loại */}
					{materialType === "file" ? (
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
										? [
											{
												uid: "1",
												name: file.name,
												status: "done" as const,
											},
										]
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
					) : (
						<Form.Item
							name="link"
							label="Link tài liệu"
							rules={[
								{ required: true, message: "Vui lòng nhập link" },
							]}
						>
							<Input
								prefix={<LinkOutlined />}
								placeholder="https://example.com/tai-lieu"
							/>
						</Form.Item>
					)}

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

			{/* Các modal khác giữ nguyên...  */}
			<Modal
				title="Chỉnh sửa tài liệu"
				open={editModalOpen}
				onCancel={() => {
					setEditModalOpen(false);
					setEditingMaterial(null);
				}}
				onOk={handleUpdate}
				okText="Cập nhật"
				cancelText="Hủy"
				style={{ maxWidth: "calc(100vw - 16px)" }}
				centered
				bodyStyle={{
					maxHeight: "75vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
					<Form.Item
						name="title"
						label="Tiêu đề"
						rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
					>
						<Input placeholder="Nhập tiêu đề tài liệu" />
					</Form.Item>
					<Form.Item name="category" label="Loại tài liệu">
						<Select>
							<Option value="lecture">Bài giảng</Option>
							<Option value="slide">Slide</Option>
							<Option value="exercise">Bài tập</Option>
							<Option value="reference">Tài liệu tham khảo</Option>
							<Option value="syllabus">Đề cương</Option>
							<Option value="other">Khác</Option>
						</Select>
					</Form.Item>

					{editingMaterial?.link && (
						<Form.Item name="link" label="Link tài liệu">
							<Input
								prefix={<LinkOutlined />}
								placeholder="https://example.com/tai-lieu"
							/>
						</Form.Item>
					)}

					<Form.Item
						name="isPublic"
						label="Chia sẻ tài liệu"
						valuePropName="checked"
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

					{editingMaterial?.fileName && (
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
								<span style={{ fontSize: 13 }}>{editingMaterial.fileName}</span>
								{editingMaterial.fileSize && (
									<Tag color="default">
										{formatFileSize(editingMaterial.fileSize)}
									</Tag>
								)}
							</div>
						</Form.Item>
					)}
				</Form>
			</Modal>

			<Modal
				title="Thêm tài liệu vào lớp"
				open={assignModalOpen}
				onCancel={() => {
					setAssignModalOpen(false);
					setAssigningMaterial(null);
				}}
				onOk={handleAssignToClass}
				okText="Thêm vào lớp"
				cancelText="Hủy"
				style={{ maxWidth: "calc(100vw - 16px)" }}
			>
				{assigningMaterial && (
					<div style={{ marginBottom: 16 }}>
						<Text strong>Tài liệu:</Text> {assigningMaterial.title}
					</div>
				)}
				<Form form={assignForm} layout="vertical">
					<Form.Item
						name="sectionId"
						label="Chọn lớp học"
						rules={[{ required: true, message: "Vui lòng chọn lớp" }]}
					>
						<Select
							showSearch
							placeholder="Chọn lớp học"
							filterOption={(input, option) =>
								String(option?.children || "")
									?.toLowerCase()
									.includes(input.toLowerCase())
							}
						>
							{mySections.map((section) => (
								<Option key={section.id} value={section.id}>
									{section.subject.subjectCode} - {section.subject.subjectName} -{" "}
									{section.sectionName} ({section.term.name})
								</Option>
							))}
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<GlobalOutlined /> Thư viện tài liệu chung
					</div>
				}
				open={libraryModalOpen}
				onCancel={() => {
					setLibraryModalOpen(false);
					setSelectedMaterialIds([]);
					setLibraryKeyword("");
					libraryForm.resetFields();
				}}
				onOk={handleAssignFromLibrary}
				okText={`Thêm vào lớp (${selectedMaterialIds.length})`}
				cancelText="Hủy"
				width={1100}
				style={{ maxWidth: "calc(100vw - 16px)" }}
				centered
			>
				<Form form={libraryForm} layout="vertical">
					<Form.Item
						name="sectionId"
						label="Chọn lớp học cần thêm tài liệu"
						rules={[{ required: true, message: "Vui lòng chọn lớp" }]}
					>
						<Select
							showSearch
							placeholder="Chọn lớp học"
							filterOption={(input, option) =>
								String(option?.children || "")
									?.toLowerCase()
									.includes(input.toLowerCase())
							}
						>
							{mySections.map((section) => (
								<Option key={section.id} value={section.id}>
									{section.subject.subjectCode} - {section.subject.subjectName} -{" "}
									{section.sectionName} ({section.term.name})
								</Option>
							))}
						</Select>
					</Form.Item>
				</Form>

				<div style={{ marginTop: 16, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm tài liệu..."
						value={libraryKeyword}
						onChange={(e) => setLibraryKeyword(e.target.value)}
						style={{ flex: 1, minWidth: 200 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchAllMaterials}>
						Tìm kiếm
					</Button>
				</div>

				{loadingLibrary ? (
					<div style={{ textAlign: "center", padding: 40 }}>
						<Spin tip="Đang tải..." />
					</div>
				) : (
					<Table<Material>
						dataSource={allMaterials}
						columns={[
							{
								title: "Tiêu đề",
								dataIndex: "title",
								key: "title",
								render: (text: string, record: Material) => (
									<div>
										<div style={{ fontWeight: 500, fontSize: 13 }}>
											{record.link ? <LinkOutlined style={{ marginRight: 6 }} /> : null}
											{text}
										</div>
										{record.description && (
											<div style={{ fontSize: 11, color: "#666" }}>
												{record.description}
											</div>
										)}
									</div>
								),
							},
							{
								title: "Người tải lên",
								key: "uploader",
								render: (_: any, record: Material) => (
									<div>
										<div style={{ fontWeight: 500, fontSize: 12 }}>
											{record.uploader?.fullName || "Không rõ"}
										</div>
										{record.uploader?.email && (
											<div style={{ fontSize: 11, color: "#666" }}>
												{record.uploader.email}
											</div>
										)}
									</div>
								),
							},
							{
								title: "File",
								key: "file",
								width: 120,
								render: (_: any, record: Material) => (
									<div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
										{getFileTypeTag(record.fileType || "", record.link)}
										{record.fileSize && (
											<Tag color="default" style={{ fontSize: 11 }}>
												{formatFileSize(record.fileSize)}
											</Tag>
										)}
									</div>
								),
							},
							{
								title: "Ngày tải",
								dataIndex: "uploadedAt",
								key: "uploadedAt",
								width: 100,
								render: (date: string) => (
									<span style={{ fontSize: 12 }}>{dayjs(date).format("DD/MM/YYYY")}</span>
								),
							},
						]}
						rowKey="id"
						rowSelection={{
							selectedRowKeys: selectedMaterialIds,
							onChange: (keys) => setSelectedMaterialIds(keys as number[]),
						}}
						pagination={{ pageSize: 6, responsive: true }}
						size="small"
						scroll={{ x: 600 }}
					/>
				)}
			</Modal>
		</div>
	);
}