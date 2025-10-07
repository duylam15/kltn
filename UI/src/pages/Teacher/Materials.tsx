import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	message,
	Switch,
	Tag,
	Modal,
	Form,
	Input,
	Upload,
	Popconfirm,
	Tooltip,
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
	CloudUploadOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const { Title } = Typography;
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
	updatedAt?: string;
};

export default function Materials() {
	const teacherId = 100; // TODO: lấy từ useAuth
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [loading, setLoading] = useState(true);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [assignedIds, setAssignedIds] = useState<Record<number, boolean>>({});
	const [visibility, setVisibility] = useState<Record<number, boolean>>({});
	const [keyword, setKeyword] = useState("");

	// Modal states
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
	const [file, setFile] = useState<any>(null);

	const [form] = Form.useForm<Material>();
	const [addForm] = Form.useForm<Material>();

	useEffect(() => {
		fetchData();
	}, [sectionId]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [res1, res2] = await Promise.all([
				axios.get(`${API_BASE}/materials/teacher/${teacherId}`),
				axios.get(`${API_BASE}/materials/class/${sectionId}`),
			]);

			if (res1.data.success) {
				setMaterials(res1.data.data || []);
			}

			if (res2.data.success) {
				const assignedMap: Record<number, boolean> = {};
				const visibilityMap: Record<number, boolean> = {};
				res2.data.data.forEach((item: any) => {
					// item.materialId là ID của tài liệu trong bảng material
					// item.isOpen là trạng thái hiển thị
					assignedMap[item.materialId] = true;
					visibilityMap[item.materialId] = item.isOpen;
				});
				setAssignedIds(assignedMap);
				setVisibility(visibilityMap);
			}
		} catch (err) {
			console.error("Lỗi khi tải dữ liệu:", err);
			toast.error("Không tải được dữ liệu tài liệu");
		} finally {
			setLoading(false);
		}
	};

	const handleAssign = async (materialId: number) => {
		try {
			const res = await axios.post(`${API_BASE}/materials/assign`, {
				courseSectionId: sectionId,
				materialId,
			});
			if (res.data.success) {
				toast.success("Đã gán tài liệu vào lớp");
				setAssignedIds((prev) => ({ ...prev, [materialId]: true }));
				// Khi mới gán, mặc định là true (hiển thị)
				setVisibility((prev) => ({ ...prev, [materialId]: true }));
			} else {
				// Nếu tài liệu đã được gán vào lớp rồi
				if (res.data.message === "Tài liệu này đã được gán vào lớp rồi") {
					toast.success("Tài liệu đã được gán vào lớp");
					// Refresh lại dữ liệu để lấy trạng thái isOpen thực tế
					fetchData();
				} else {
					toast.error(res.data.message || "Không thể gán tài liệu");
				}
			}
		} catch (err: any) {
			console.error("Lỗi assign:", err);

			// Kiểm tra nếu là lỗi 400 với message đã gán
			if (err.response?.status === 400 &&
				err.response?.data?.message === "Tài liệu này đã được gán vào lớp rồi") {
				toast.success("Tài liệu đã được gán vào lớp");
				// Refresh lại dữ liệu để lấy trạng thái isOpen thực tế
				fetchData();
			} else {
				toast.error("Lỗi server khi gán tài liệu");
			}
		}
	};

	const handleToggleVisibility = async (materialId: number, checked: boolean) => {
		try {
			const res = await axios.patch(`${API_BASE}/materials/visibility`, {
				courseSectionId: sectionId,
				materialId,
				isOpen: checked,
			});
			if (res.data.success) {
				toast.success(`Đã ${checked ? "mở" : "đóng"} tài liệu`);
				setVisibility((prev) => ({ ...prev, [materialId]: checked }));
			} else {
				toast.error(res.data.message || "Không thể cập nhật trạng thái");
			}
		} catch (err: any) {
			console.error("Lỗi toggle visibility:", err);
			toast.error("Lỗi server khi cập nhật trạng thái");
		}
	};

	const handleView = (material: Material) => {
		if (material.filePath) {
			window.open(`http://localhost:4000/${material.filePath}`, "_blank");
		} else {
			toast.error("Tài liệu này chưa có file để xem");
		}
	};

	const handleDelete = async (id: number) => {
		try {
			const res = await axios.delete(`${API_BASE}/materials/${id}`);
			if (res.data.success) {
				toast.success("Xóa tài liệu thành công");
				setMaterials((prev) => prev.filter((m) => m.id !== id));
				// Remove from assigned list if exists
				if (assignedIds[id]) {
					const { [id]: removed, ...rest } = assignedIds;
					setAssignedIds(rest);
				}
				if (visibility[id] !== undefined) {
					const { [id]: removed, ...rest } = visibility;
					setVisibility(rest);
				}
			} else {
				toast.error(res.data.message || "Không thể xóa tài liệu");
			}
		} catch (err: any) {
			console.error("Lỗi delete:", err.response?.data || err.message);
			toast.error("Không thể xóa tài liệu (có thể đã được gán vào lớp)");
		}
	};

	const handleUpdate = async () => {
		try {
			const values = await form.validateFields();
			if (!editingMaterial) return;

			await axios.put(`${API_BASE}/materials/${editingMaterial.id}`, values);
			toast.success("Cập nhật tài liệu thành công");
			setEditModalOpen(false);
			setEditingMaterial(null);
			fetchData();
		} catch (err: any) {
			if (err?.errorFields) return; // lỗi validate form
			console.error("Lỗi update:", err);
			toast.error("Không thể cập nhật tài liệu");
		}
	};

	const handleAdd = async () => {
		try {
			const values = await addForm.validateFields();

			if (!file) {
				toast.error("Vui lòng chọn file");
				return;
			}

			const formData = new FormData();
			formData.append("file", file);
			formData.append("sectionId", sectionId.toString());
			formData.append("title", values.title);
			formData.append("description", values.description || "");
			formData.append("uploadedBy", teacherId.toString());

			await axios.post(`${API_BASE}/materials/upload`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success("Thêm tài liệu thành công");
			setAddModalOpen(false);
			setFile(null);
			addForm.resetFields();
			fetchData();
		} catch (err: any) {
			if (err?.errorFields) return; // lỗi validate form
			console.error("Lỗi add:", err);
			toast.error("Không thể thêm tài liệu");
		}
	};

	const getFileTypeTag = (fileType: string) => {
		const type = fileType?.toLowerCase();
		if (type?.includes("pdf")) return <Tag color="red">PDF</Tag>;
		if (type?.includes("word") || type?.includes("doc")) return <Tag color="blue">DOC</Tag>;
		if (type?.includes("excel") || type?.includes("sheet")) return <Tag color="green">XLS</Tag>;
		if (type?.includes("powerpoint") || type?.includes("presentation")) return <Tag color="orange">PPT</Tag>;
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
			sorter: (a: Material, b: Material) => a.title.localeCompare(b.title),
			render: (text: string) => (
				<div style={{ fontWeight: 600, color: "#1890ff" }}>
					<FileOutlined style={{ marginRight: 8 }} />
					{text}
				</div>
			),
		},
		{
			title: "Mô tả",
			dataIndex: "description",
			key: "description",
			ellipsis: { showTitle: false },
			render: (text: string) => (
				<Tooltip title={text} placement="topLeft">
					{text || <Tag color="default">Không có mô tả</Tag>}
				</Tooltip>
			),
		},
		{
			title: "File",
			key: "fileInfo",
			render: (_: any, record: Material) => (
				<div>
					<div style={{ marginBottom: 4 }}>
						{record.fileName ? (
							<span style={{ fontSize: 12, color: "#666" }}>{record.fileName}</span>
						) : (
							<Tag color="red">Chưa có file</Tag>
						)}
					</div>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						{getFileTypeTag(record.fileType || "")}
						{record.fileSize && (
							<Tag color="default" style={{ margin: 0 }}>
								{formatFileSize(record.fileSize)}
							</Tag>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Ngày tải lên",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			sorter: (a: Material, b: Material) =>
				new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
			render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
		},
		{
			title: "Trạng thái lớp",
			key: "classStatus",
			align: "center" as const,
			render: (_: any, record: Material) =>
				assignedIds[record.id] ? (
					<Switch
						checkedChildren="Hiển thị"
						unCheckedChildren="Ẩn"
						checked={visibility[record.id] || false}
						onChange={(checked) => handleToggleVisibility(record.id, checked)}
					/>
				) : (
					<Button
						type="primary"
						size="small"
						icon={<CloudUploadOutlined />}
						onClick={() => handleAssign(record.id)}
					>
						Gán vào lớp
					</Button>
				),
		},
		{
			title: "Hành động",
			key: "actions",
			render: (_: any, record: Material) => (
				<div style={{ display: "flex", gap: 8 }}>
					<Tooltip title="Xem tài liệu">
						<Button
							size="small"
							icon={<EyeOutlined />}
							onClick={() => handleView(record)}
							disabled={!record.filePath}
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

	const filteredMaterials = materials.filter(
		(m) =>
			!keyword ||
			m.title.toLowerCase().includes(keyword.toLowerCase()) ||
			m.description?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.fileName?.toLowerCase().includes(keyword.toLowerCase())
	);

	if (loading) return <Spin tip="Đang tải..." />;

	return (
		<div style={{ padding: 16 }}>
			{/* Header + search + refresh + add */}
			<div
				style={{
					display: "flex",
					justifyContent: "flex-end",
					alignItems: "center",
					marginBottom: 16,
					marginTop: -16,
				}}
			>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, tên file..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 280 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchData}>
						Refresh
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setEditingMaterial(null);
							addForm.resetFields();
							setFile(null);
							setAddModalOpen(true);
						}}
					>
						Thêm tài liệu
					</Button>
				</div>
			</div>

			<Table<Material>
				dataSource={filteredMaterials}
				columns={columns}
				rowKey="id"
				bordered
				pagination={{ pageSize: 10 }}
				scroll={{ x: "max-content" }}
			/>

			{/* Modal sửa tài liệu */}
			<Modal
				title="Chỉnh sửa tài liệu"
				open={editModalOpen}
				onCancel={() => {
					setEditModalOpen(false);
					setEditingMaterial(null);
				}}
				onOk={handleUpdate}
				okText="Cập nhật"
			>
				<Form form={form} layout="vertical">
					<Form.Item
						name="title"
						label="Tiêu đề"
						rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
					>
						<Input placeholder="Nhập tiêu đề tài liệu" />
					</Form.Item>
					<Form.Item name="description" label="Mô tả">
						<Input.TextArea
							rows={4}
							placeholder="Nhập mô tả chi tiết về tài liệu"
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
								}}
							>
								<FileOutlined />
								<span>{editingMaterial.fileName}</span>
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

			{/* Modal thêm tài liệu */}
			<Modal
				title="Thêm tài liệu mới"
				open={addModalOpen}
				onCancel={() => {
					setAddModalOpen(false);
					setFile(null);
					addForm.resetFields();
				}}
				onOk={handleAdd}
				okText="Tải lên"
			>
				<Form form={addForm} layout="vertical">
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
							fileList={file ? [{ uid: '1', name: file.name, status: 'done' as const }] : []}
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
				</Form>
			</Modal>
		</div>
	);
}