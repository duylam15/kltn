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
	Avatar,
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
	FolderOpenOutlined,
	UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { v4 as uuidv4 } from "uuid";

const { Title } = Typography;
const API_BASE = "http://localhost:4000/api/v1";

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
	uploader?: User; // Thông tin người tải lên
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

	 const { user } = useAuth();
	
	  console.log(user);

	useEffect(() => {
		fetchMaterials();
	}, []);

	async function fetchMaterials() {
		try {
			setLoading(true);
			const res = await axios.get<{ success: boolean; data: Material[] }>(
				`${API_BASE}/materials`
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
			const res = await axios.delete(`${API_BASE}/materials/${id}`);
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
		if (material.filePath) {
			window.open(`http://localhost:4000/${material.filePath}`, "_blank");
		} else {
			toast.error("Tài liệu này chưa có file để xem");
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			if (editing) {
				// Cập nhật tài liệu
				await axios.put(`${API_BASE}/materials/${editing.id}`, {
					title: values.title.trim(),
					description: values.description?.trim() || "",
				});
				toast.success("Đã cập nhật tài liệu");
			} else {
				// Thêm tài liệu mới
				if (!file) {
					toast.error("Vui lòng chọn file");
					return;
				}
				const uniqueCode = uuidv4(); // 👈 mã ngẫu nhiên

				const formData = new FormData();
				formData.append("file", file);
				formData.append("title", values.title.trim());
				formData.append("description", values.description?.trim() || "");
				formData.append("uploadedBy", user?.id.toString() || "0");
				formData.append("originalMaterialId", uniqueCode); // 👈 luôn duy nhất

				await axios.post(`${API_BASE}/materials/upload`, formData, {
					headers: { "Content-Type": "multipart/form-data" },
				});
				toast.success("Đã thêm tài liệu mới");
			}

			setModalOpen(false);
			setEditing(null);
			setFile(null);
			form.resetFields();
			fetchMaterials();
		} catch (err: any) {
			if (err?.errorFields) return;
			const errorMsg = err?.response?.data?.message || "Không thể lưu tài liệu";
			toast.error(errorMsg);
		}
	};

	const getFileTypeTag = (fileType?: string) => {
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
			width: 100,
			ellipsis: { showTitle: false },
			sorter: (a: Material, b: Material) => a.title.localeCompare(b.title),
			render: (text: string) => (
				<Tooltip title={text} placement="topLeft">
					<div style={{ fontWeight: 600, color: "#1890ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
						<FileOutlined style={{ marginRight: 8 }} />
						{text}
					</div>
				</Tooltip>
			),
		},
		{
			title: "Mô tả",
			dataIndex: "description",
			key: "description",
			width: 70,
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
			title: "Tên file",
			dataIndex: "fileName",
			key: "fileName",
			width: 100,
			ellipsis: { showTitle: false },
			render: (text: string) => (
				<Tooltip title={text} placement="topLeft">
					<div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
						{text || <Tag color="red">Chưa có file</Tag>}
					</div>
				</Tooltip>
			),
		},
		{
			title: "Loại file",
			dataIndex: "fileType",
			key: "fileType",
			width: 70,
			align: "center" as const,
			render: (text: string) => getFileTypeTag(text),
		},
		{
			title: "Kích thước",
			dataIndex: "fileSize",
			key: "fileSize",
			width: 100,
			align: "center" as const,
			sorter: (a: Material, b: Material) => (a.fileSize || 0) - (b.fileSize || 0),
			render: (size: number) => formatFileSize(size),
		},
		{
			title: "Người tải lên",
			key: "uploader",
			width: 100,
			sorter: (a: Material, b: Material) =>
				(a.uploader?.fullName || "").localeCompare(b.uploader?.fullName || ""),
			render: (_: any, record: Material) => (
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<div style={{ overflow: "hidden" }}>
						<Tooltip title={record.uploader?.fullName} placement="topLeft">
						<div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
							{record.uploader?.fullName || "Không xác định"}
							</div>
						</Tooltip>
						{record.uploader?.email && (
							<div style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
								{record.uploader.email}
							</div>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Ngày tải lên",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: 100,
			sorter: (a: Material, b: Material) =>
				new Date(a.uploadedAt || 0).getTime() -
				new Date(b.uploadedAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 100,
			align: "center" as const,
			render: (_: any, record: Material) => (
				<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
					<Tooltip title="Xem">
						<Button
							icon={<EyeOutlined />}
							size="small"
							onClick={() => handleView(record)}
							disabled={!record.filePath}
						/>
					</Tooltip>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => {
								setEditing(record);
								form.setFieldsValue({
									title: record.title,
									description: record.description,
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
				</div>
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
			m.uploader?.fullName?.toLowerCase().includes(kw) ||
			m.uploader?.email?.toLowerCase().includes(kw)
		);
	});

	const totalFileSize = materials.reduce((sum, m) => sum + (m.fileSize || 0), 0);

	return (
		<div className="pl-3 pr-3">
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Title level={3} className="mt-2">
					<div className="flex items-center gap-2">
						<div className="mt-1">
							<FileText />
						</div>{" "}
						Quản lý Tài liệu
					</div>
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, tên file, người tải..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 420 }}
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
					}}
					locale={{ emptyText: "Không có tài liệu nào" }}
						scroll={undefined} // 👈 bỏ scroll.x
				/>
			)}

			{/* Modal thêm/sửa */}
			<Modal
				title={editing ? "Sửa thông tin tài liệu" : "Thêm tài liệu mới"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					setFile(null);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tải lên"}
				cancelText="Hủy"
				width={600}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						label="Tiêu đề tài liệu"
						name="title"
						rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
					>
						<Input placeholder="VD: Bài giảng chương 1" maxLength={200} />
					</Form.Item>

					<Form.Item label="Mô tả" name="description">
						<Input.TextArea
							rows={4}
							placeholder="Nhập mô tả chi tiết về tài liệu"
							maxLength={500}
						/>
					</Form.Item>

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
				</Form>
			</Modal>
		</div>
	);
}