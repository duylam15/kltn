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
	EyeInvisibleOutlined,
	CheckCircleOutlined,
	FolderOpenOutlined,
	CopyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../context/authContext";

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
	originalMaterialId?: number; // ← THÊM DÒNG NÀY
	uploadedBy: number;
	uploadedAt: string;
	updatedAt?: string;
};

export default function Materials() {
		const { user } = useAuth(); // ✅ thêm dòng này
	const teacherId = user?.id; // ID của giáo viên hiện tại
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

	const [libraryModalOpen, setLibraryModalOpen] = useState(false);
	const [allMaterials, setAllMaterials] = useState<Material[]>([]);
	const [loadingLibrary, setLoadingLibrary] = useState(false);
	const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
	const [libraryKeyword, setLibraryKeyword] = useState("");
	// ← ĐẾN ĐÂY
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
				assignedBy: teacherId,  // ← THÊM DÒNG NÀY
			});
			if (res.data.success) {
				toast.success("Đã gán tài liệu vào lớp");
				setAssignedIds((prev) => ({ ...prev, [materialId]: true }));
				setVisibility((prev) => ({ ...prev, [materialId]: true }));
			} else {
				if (res.data.message === "Tài liệu này đã được gán vào lớp rồi") {
					toast.success("Tài liệu đã được gán vào lớp");
					fetchData();
				} else {
					toast.error(res.data.message || "Không thể gán tài liệu");
				}
			}
		} catch (err: any) {
			console.error("Lỗi assign:", err);

			if (err.response?.status === 400 &&
				err.response?.data?.message === "Tài liệu này đã được gán vào lớp rồi") {
				toast.success("Tài liệu đã được gán vào lớp");
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

			if (!teacherId) {
				toast.error("Không thể xác định giáo viên");
				return;
			}

			const uniqueCode = uuidv4(); // 👈 mã ngẫu nhiên
console.log("🆔 Mã uniqueMaterialId:", uniqueCode);
			const formData = new FormData();
			formData.append("file", file);
			formData.append("sectionId", sectionId.toString());
			formData.append("title", values.title);
			formData.append("description", values.description || "");
			formData.append("uploadedBy", teacherId.toString());
			formData.append("originalMaterialId", uniqueCode); // 👈 luôn duy nhất

			await axios.post(`${API_BASE}/materials/upload`, formData, {
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

	const fetchAllMaterials = async () => {
		try {
			setLoadingLibrary(true);

			const [allRes, myRes] = await Promise.all([
				axios.get(`${API_BASE}/materials`),
				axios.get(`${API_BASE}/materials/teacher/${teacherId}`)
			]);

			if (allRes.data.success && myRes.data.success) {
				const allMats = allRes.data.data;
				const myMats = myRes.data.data;

				// ✅ Lấy Set chứa originalMaterialId của các tài liệu tôi đã copy
				const myOriginalMaterialIds = new Set(
					myMats
						.filter((m: Material) => m.originalMaterialId)
						.map((m: Material) => m.originalMaterialId)
				);

				console.log("📚 Tất cả tài liệu:", allMats.length);
				console.log("📖 Tài liệu của tôi:", myMats.length);
				console.log("🔗 OriginalMaterialIds đã copy:", Array.from(myOriginalMaterialIds));

				// ✅ Bước 1: Lọc bỏ tài liệu của chính mình (không phải copy)
				const otherMaterials = allMats.filter((m: Material) => {
					// Giữ lại nếu: không phải tự tạo gốc HOẶC là bản copy
					return !(m.uploadedBy === teacherId && !m.originalMaterialId);
				});

				// ✅ Bước 2: Nhóm theo rootId, chỉ lấy 1 đại diện
				const materialsByRootId = new Map<number, Material>();

				otherMaterials.forEach((m: Material) => {
					const rootId = m.originalMaterialId || m.id;

					// Nếu chưa có rootId này, hoặc tài liệu hiện tại là bản gốc (ưu tiên bản gốc)
					if (!materialsByRootId.has(rootId) || !m.originalMaterialId) {
						materialsByRootId.set(rootId, m);
					}
				});

				// ✅ Bước 3: Lọc bỏ những rootId đã copy
				const availableMaterials = Array.from(materialsByRootId.entries())
					.filter(([rootId, material]) => {
						const alreadyCopied = myOriginalMaterialIds.has(rootId);

						if (alreadyCopied) {
							console.log(`❌ Ẩn tài liệu (đã copy): ${material.title} (rootId: ${rootId})`);
							return false;
						}

						console.log(`✅ Hiển thị tài liệu: ${material.title} (rootId: ${rootId})`);
						return true;
					})
					.map(([_, material]) => material);

				console.log("✅ Tài liệu có thể copy:", availableMaterials.length);

				setAllMaterials(availableMaterials);
			}
		} catch (err) {
			console.error("Lỗi fetch materials:", err);
			toast.error("Không tải được danh sách tài liệu");
		} finally {
			setLoadingLibrary(false);
		}
	};

	const handleCopyMaterials = async () => {
		if (selectedMaterialIds.length === 0) {
			toast.error("Vui lòng chọn ít nhất 1 tài liệu");
			return;
		}

		try {
			// Lấy thông tin chi tiết của các tài liệu được chọn
			const selectedMaterials = allMaterials.filter(m =>
				selectedMaterialIds.includes(m.id)
			);

			// Tạo material mới cho từng tài liệu được chọn
			const createPromises = selectedMaterials.map(async (material) => {
				// Tạo material mới
				const createRes = await axios.post(`${API_BASE}/materials`, {
					title: material.title,
					description: material.description,
					fileName: material.fileName,
					filePath: material.filePath,
					fileSize: material.fileSize,
					fileType: material.fileType,
					uploadedBy: teacherId,
					originalMaterialId: material.originalMaterialId || material.id, // ← THÊM DÒNG NÀY
				});

				// Nếu tạo thành công, gán vào lớp luôn
				if (createRes.data.success) {
					await axios.post(`${API_BASE}/materials/assign`, {
						courseSectionId: sectionId,
						materialId: createRes.data.data.id,
						assignedBy: teacherId,
					});
				}

				return createRes;
			});

			await Promise.all(createPromises);

			toast.success(`Đã sao chép ${selectedMaterialIds.length} tài liệu`);
			setLibraryModalOpen(false);
			setSelectedMaterialIds([]);
			setLibraryKeyword("");
			fetchData();
		} catch (err: any) {
			console.error("Lỗi copy:", err);
			toast.error(err.response?.data?.message || "Không thể sao chép tài liệu");
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

	const getStatistics = () => {
		const totalMaterials = materials.length;
		const assignedMaterials = Object.keys(assignedIds).length;
		const unassignedMaterials = totalMaterials - assignedMaterials;
		const visibleMaterials = Object.values(visibility).filter(v => v === true).length;
		const hiddenMaterials = assignedMaterials - visibleMaterials;
		const totalFileSize = materials.reduce((sum, m) => sum + (m.fileSize || 0), 0);

		return {
			totalMaterials,
			assignedMaterials,
			unassignedMaterials,
			visibleMaterials,
			hiddenMaterials,
			totalFileSize,
		};
	};

	const stats = getStatistics();

	if (loading) return <Spin tip="Đang tải..." />;

	return (
		<div style={{ padding: 16 }}>
			{/* Header + search + refresh + add */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
					marginTop: -16,
				}}
			>
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
						}}
					>
						<CheckCircleOutlined style={{ fontSize: 14, color: "#722ed1" }} />
						<span>Hiển thị:</span>
						<strong style={{ color: "#722ed1" }}>{stats.visibleMaterials}</strong>
					</div>

					{stats.hiddenMaterials > 0 && (
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
							}}
						>
							<EyeInvisibleOutlined style={{ fontSize: 14, color: "#ff4d4f" }} />
							<span>Đã ẩn:</span>
							<strong style={{ color: "#ff4d4f" }}>{stats.hiddenMaterials}</strong>
						</div>
					)}
				</div>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, tên file..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 200 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchData}>
						Refresh
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

			<Modal
				title="Lấy tài liệu từ thư viện"
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
								m.title.toLowerCase().includes(libraryKeyword.toLowerCase()) ||
								m.description?.toLowerCase().includes(libraryKeyword.toLowerCase())
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
							},
							{
								title: "File",
								key: "file",
								render: (_: any, record: Material) => (
									<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
							onChange: (keys) => setSelectedMaterialIds(keys as number[]),
						}}
						pagination={{ pageSize: 5 }}
						size="small"
					/>
				)}
			</Modal>
		</div>
	);
}