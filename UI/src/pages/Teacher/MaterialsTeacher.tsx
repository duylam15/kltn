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
	Select,
	Card,
	Row,
	Col,
	Statistic,
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
	CopyOutlined,
	CloudUploadOutlined,
	FolderOpenOutlined,
	CheckCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../context/authContext";
import { FileText } from "lucide-react";

const { Title, Text } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";

type Material = {
	id: number;
	materialId: number;
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
		fullName: string;
		email: string;
	};
	originalMaterialId?: string;
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

export default function MaterialsTeacher() {
	const { user } = useAuth();
	const userId = user?.id;
	const teacherId = user?.teacher?.id;
	console.log("teacherId", teacherId);		

	const [loading, setLoading] = useState(true);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [mySections, setMySections] = useState<Section[]>([]);
	const [keyword, setKeyword] = useState("");
	const [filterPublic, setFilterPublic] = useState<boolean | null>(null);

	// Modal states
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [libraryModalOpen, setLibraryModalOpen] = useState(false);

	const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
	const [assigningMaterial, setAssigningMaterial] = useState<Material | null>(null);
	const [file, setFile] = useState<any>(null);

	const [form] = Form.useForm();
	const [addForm] = Form.useForm();
	const [assignForm] = Form.useForm();

	// Library states
	const [allMaterials, setAllMaterials] = useState<Material[]>([]);
	const [loadingLibrary, setLoadingLibrary] = useState(false);
	const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
	const [libraryKeyword, setLibraryKeyword] = useState("");

	useEffect(() => {
		if (userId) {
			fetchData();
			fetchMySections();
		}
	}, [userId]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await axios.get(`${API_BASE}/materials/teacher/${userId}`);
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
			const res = await axios.get(
				`${API_BASE}/sections-instructors?teacher_id=${teacherId}`
			);
			if (res.data.success) {
				setMySections(res.data.data.map((item: any) => item.section) || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải lớp học:", err);
		}
	};


 // ====== SAO CHÉP TÀI LIỆU  ======
async function copyOne(materialId: number, forceDuplicate = false) {
  await axios.post(`${API_BASE}/materials/copy`, {
  materialId,
  userId,  // 👈 thuộc "tủ của tôi"
});
}






  const handleCopyMaterials = async () => {
  if (selectedMaterialIds.length === 0) {
    toast.error("Vui lòng chọn ít nhất 1 tài liệu");
    return;
  }

  try {
    for (const id of selectedMaterialIds) {
      await copyOne(id);  
    }

    toast.success(`Đã xử lý sao chép ${selectedMaterialIds.length} tài liệu`);
    setLibraryModalOpen(false);
    setSelectedMaterialIds([]);
    setLibraryKeyword("");
    fetchData(); // refresh "tủ của tôi"
  } catch (e: any) {
    if (e?.message !== "cancelled") {
      toast.error(e?.response?.data?.message || "Không thể sao chép tài liệu");
    }
  }
};


  const fetchAllMaterials = async () => {
    try {
      setLoadingLibrary(true);
      const { data } = await axios.get(`${API_BASE}/materials/public`, {
  params: { page: 1, size: 50, userId }, // 👈 gửi userId hiện tại
});

      if (data?.success) setAllMaterials(data.data || []);
    } catch (err) {
      toast.error("Không tải được danh sách tài liệu chung");
    } finally {
      setLoadingLibrary(false);
    }
  };


	const handleTogglePublic = async (materialId: number, isPublic: boolean) => {
		try {
			const res = await axios.put(`${API_BASE}/materials/${materialId}`, {
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

	const handleAdd = async () => {
		try {
			const values = await addForm.validateFields();

			if (!file) {
				toast.error("Vui lòng chọn file");
				return;
			}

			const uniqueCode = uuidv4();
			const formData = new FormData();
			formData.append("file", file);
			formData.append("title", values.title);
			formData.append("description", values.description || "");
			formData.append("isPublic", values.isPublic ? "true" : "false");
			formData.append("userId", String(userId));

			await axios.post(`${API_BASE}/materials`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			toast.success("Thêm tài liệu thành công");
			setAddModalOpen(false);
			setFile(null);
			addForm.resetFields();
			fetchData();
		} catch (err: any) {
			if (err?.errorFields) return;
			console.error("Lỗi add:", err);
			toast.error("Không thể thêm tài liệu");
		}
	};

	const handleUpdate = async () => {
		try {
			const values = await form.validateFields();
			if (!editingMaterial) return;

			await axios.patch(`${API_BASE}/materials/${editingMaterial.id}`, values);
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
			const res = await axios.delete(`${API_BASE}/materials/${id}`);
			if (res.data.success) {
				toast.success("Xóa tài liệu thành công");
				setMaterials((prev) => prev.filter((m) => m.id !== id));
			}
		} catch (err: any) {
			console.error("Lỗi delete:", err);
			toast.error("Không thể xóa tài liệu (có thể đã được gán vào lớp)");
		}
	};

	const handleAssignToClass = async () => {
		try {
			const values = await assignForm.validateFields();
			if (!assigningMaterial) return;

			await axios.post(`${API_BASE}/materials/assign`, {
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
		if (material.filePath) {
			window.open(`http://localhost:4000/${material.filePath}`, "_blank");
		} else {
			toast.error("Tài liệu này chưa có file để xem");
		}
	};

	const getFileTypeTag = (fileType: string) => {
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
			sorter: (a: Material, b: Material) => a.title.localeCompare(b.title),
			render: (text: string, record: Material) => (
				<div>
					<div style={{ fontWeight: 600, color: "#1890ff" }}>
						<FileOutlined style={{ marginRight: 8 }} />
						{text}
					</div>
					{record.description && (
						<div
							style={{ fontSize: 12, color: "#666", marginTop: 4 }}
						>
							{record.description}
						</div>
					)}
				</div>
			),
		},
		{
			title: "File",
			key: "fileInfo",
			width: 200,
			render: (_: any, record: Material) => (
				<div>
					<div style={{ marginBottom: 4 }}>
						{record.fileName ? (
							<span style={{ fontSize: 12, color: "#666" }}>
								{record.fileName}
							</span>
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
			title: "Trạng thái",
			key: "status",
			width: 150,
			align: "center" as const,
			render: (_: any, record: Material) => (
				<Switch
					checkedChildren={<><GlobalOutlined /> Công khai</>}
					unCheckedChildren={<><LockOutlined /> Riêng tư</>}
					checked={record.isPublic}
					onChange={(checked) => handleTogglePublic(record.id, checked)}
				/>
			),
		},
		{
			title: "Ngày tải lên",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: 150,
			sorter: (a: Material, b: Material) =>
				new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
			render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 200,
			align: "center" as const,
			render: (_: any, record: Material) => (
				<div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
					<Tooltip title="Xem tài liệu">
						<Button
							size="small"
							icon={<EyeOutlined />}
							onClick={() => handleView(record)}
							disabled={!record.filePath}
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
		const matchKeyword =
			!keyword ||
			m.title.toLowerCase().includes(keyword.toLowerCase()) ||
			m.description?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.fileName?.toLowerCase().includes(keyword.toLowerCase());

		const matchPublic =
			filterPublic === null || m.isPublic === filterPublic;

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
		<div style={{ padding: 16 }}>
			{/* Header */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<Title level={3} style={{ margin: 0 }}>
					<div className="flex items-center gap-2">
						<FileText /> Quản lý Tài liệu
					</div>
				</Title>
			</div>

			{/* Statistics */}
			<Row gutter={16} style={{ marginBottom: 16 }}>
				<Col span={6}>
					<Card>
						<Statistic
							title="Tổng tài liệu"
							value={stats.totalMaterials}
							prefix={<FolderOpenOutlined />}
							valueStyle={{ color: "#1890ff" }}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="Tài liệu công khai"
							value={stats.publicMaterials}
							prefix={<GlobalOutlined />}
							valueStyle={{ color: "#52c41a" }}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="Tài liệu riêng tư"
							value={stats.privateMaterials}
							prefix={<LockOutlined />}
							valueStyle={{ color: "#faad14" }}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title="Tổng dung lượng"
							value={formatFileSize(stats.totalFileSize)}
							prefix={<CheckCircleOutlined />}
							valueStyle={{ color: "#722ed1" }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Filters and Actions */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 16,
					gap: 8,
					flexWrap: "wrap",
				}}
			>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, tên file..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 300 }}
					/>
					<Select
						allowClear
						placeholder="Lọc theo trạng thái"
						style={{ width: 150 }}
						value={filterPublic}
						onChange={setFilterPublic}
					>
						<Option value={true}>Công khai</Option>
						<Option value={false}>Riêng tư</Option>
					</Select>
				</div>

				<div style={{ display: "flex", gap: 8 }}>
					<Button icon={<ReloadOutlined />} onClick={fetchData}>
						Làm mới
					</Button>
					<Button
						icon={<CopyOutlined />}
						onClick={() => {
							setLibraryModalOpen(true);
							fetchAllMaterials();
						}}
					>
						Lấy từ thư viện
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							addForm.resetFields();
							setFile(null);
							setAddModalOpen(true);
						}}
					>
						Thêm tài liệu
					</Button>
				</div>
			</div>

			{/* Table */}
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
				scroll={{ x: "max-content" }}
			/>

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
				cancelText="Hủy"
				width={600}
			>
				<Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
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
					<Form.Item
						name="isPublic"
						label="Chia sẻ tài liệu"
						valuePropName="checked"
						initialValue={false}
						tooltip="Khi bật, giảng viên khác có thể xem và sao chép tài liệu này"
					>
						<Switch
							checkedChildren={<><ShareAltOutlined /> Công khai</>}
							unCheckedChildren={<><LockOutlined /> Riêng tư</>}
						/>
					</Form.Item>
				</Form>
			</Modal>

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
				cancelText="Hủy"
			>
				<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
					<Form.Item
						name="isPublic"
						label="Chia sẻ tài liệu"
						valuePropName="checked"
					>
						<Switch
							checkedChildren={<><ShareAltOutlined /> Công khai</>}
							unCheckedChildren={<><LockOutlined /> Riêng tư</>}
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

			{/* Modal thêm vào lớp */}
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
								String(option?.children || '')
									?.toLowerCase()
									.includes(input.toLowerCase())
							}
						>
							{mySections.map((section) => (
								<Option key={section.id} value={section.id}>
									{section.subject.subjectCode} -{" "}
									{section.subject.subjectName} - {section.sectionName} (
									{section.term.name})
								</Option>
							))}
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			{/* Modal thư viện */}
			<Modal
				title={
					<div className="flex items-center gap-2">
						<CopyOutlined /> Lấy tài liệu từ thư viện chung
					</div>
				}
				open={libraryModalOpen}
				onCancel={() => {
					setLibraryModalOpen(false);
					setSelectedMaterialIds([]);
					setLibraryKeyword("");
				}}
				onOk={handleCopyMaterials}
				okText={`Sao chép (${selectedMaterialIds.length})`}
				cancelText="Hủy"
				width={900}
				centered
			>
				<div style={{ marginBottom: 16 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm tài liệu..."
						value={libraryKeyword}
						onChange={(e) => setLibraryKeyword(e.target.value)}
					/>
				</div>

				{loadingLibrary ? (
					<div style={{ textAlign: "center", padding: 40 }}>
						<Spin tip="Đang tải..." />
					</div>
				) : (
					<Table<Material>
						dataSource={allMaterials.filter(
							(m) =>
								!libraryKeyword ||
								m.title
									.toLowerCase()
									.includes(libraryKeyword.toLowerCase()) ||
								m.description
									?.toLowerCase()
									.includes(libraryKeyword.toLowerCase())
						)}
						columns={[
							{
								title: "Tiêu đề",
								dataIndex: "title",
								key: "title",
								render: (text: string, record: Material) => (
									<div>
										<div style={{ fontWeight: 500 }}>{text}</div>
										{record.description && (
											<div style={{ fontSize: 12, color: "#666" }}>
												{record.description}
											</div>
										)}
									</div>
								),
							},{
								title: "Người tải lên",
								key: "uploader",
								width: 150,
								render: (_: any, record: Material) => (
									<div
										style={{
											display: "flex",
											gap: 8,
											alignItems: "center",
										}}
									>
										<div style={{ fontWeight: 500 }}>
											{record.uploader?.fullName || "Không rõ"}
										</div>
									</div>
								),
							},
							{
								title: "File",
								key: "file",
								width: 150,
								render: (_: any, record: Material) => (
									<div
										style={{
											display: "flex",
											gap: 8,
											alignItems: "center",
										}}
									>
										{getFileTypeTag(record.fileType || "")}
										{record.fileSize && (
											<Tag color="default">
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
								width: 140,
								render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
							},
						]}
						rowKey="id"
						rowSelection={{
							selectedRowKeys: selectedMaterialIds,
							onChange: (keys) =>
								setSelectedMaterialIds(keys as number[]),
						}}
						pagination={{ pageSize: 5 }}
						size="small"
					/>
				)}
			</Modal>
		</div>
	);
}