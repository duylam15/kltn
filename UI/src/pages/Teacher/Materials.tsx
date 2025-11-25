import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	Switch,
	Tag,
	Tooltip,
	Card,
	Row,
	Col,
	Statistic,
	Input,
	Modal,
	Tabs,
} from "antd";
import {
	EyeOutlined,
	ReloadOutlined,
	SearchOutlined,
	FileOutlined,
	CheckCircleOutlined,
	EyeInvisibleOutlined,
	FolderOpenOutlined,
	DownloadOutlined,
	PlusOutlined,
	GlobalOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";

const { Title, Text } = Typography;
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
	updatedAt: string;
	isPublic: boolean;
	category: string;
	originalMaterialId: string;
	uploader?: { id: number; fullName: string; email: string };
};

type CourseMaterial = {
	id: number;
	materialId: number;
	isOpen: boolean;
	assignedAt: string;
	assignedBy: number;
	courseSectionId: number;
	material: Material;
};

export default function Materials() {
	const { user } = useAuth();
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [loading, setLoading] = useState(true);
	const [materials, setMaterials] = useState<CourseMaterial[]>([]);
	const [keyword, setKeyword] = useState("");

	// Modal thêm tài liệu
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [publicMaterials, setPublicMaterials] = useState<Material[]>([]);
	const [myMaterials, setMyMaterials] = useState<Material[]>([]);
	const [loadingPublic, setLoadingPublic] = useState(false);
	const [loadingMy, setLoadingMy] = useState(false);
	const [searchPublic, setSearchPublic] = useState("");
	const [searchMy, setSearchMy] = useState("");

	useEffect(() => {
		fetchData();
	}, [sectionId]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const res = await axios.get(`${API_BASE}/materials/class/${sectionId}`);

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

	// Lấy tài liệu public
	const fetchPublicMaterials = async () => {
		try {
			setLoadingPublic(true);
			const res = await axios.get(`${API_BASE}/materials/public`, {
				params: {
					userId: user?.id,
					keyword: searchPublic,
					page: 1,
					size: 100,
				},
			});

			if (res.data.success) {
				setPublicMaterials(res.data.data || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải tài liệu public:", err);
			toast.error("Không tải được tài liệu public");
		} finally {
			setLoadingPublic(false);
		}
	};

	// Lấy tài liệu của tôi
	const fetchMyMaterials = async () => {
		try {
			setLoadingMy(true);
			const res = await axios.get(`${API_BASE}/materials/teacher/${user?.id}`);

			if (res.data.success) {
				setMyMaterials(res.data.data || []);
			}
		} catch (err) {
			console.error("Lỗi khi tải tài liệu của tôi:", err);
			toast.error("Không tải được tài liệu của tôi");
		} finally {
			setLoadingMy(false);
		}
	};

	// Mở modal
	const showAddModal = () => {
		setIsModalVisible(true);
		fetchPublicMaterials();
		fetchMyMaterials();
	};

	// Gán tài liệu vào lớp
	const handleAssignMaterial = async (materialId: number) => {
		try {
			const res = await axios.post(`${API_BASE}/materials/assign`, {
				courseSectionId: sectionId,
				materialId,
				assignedBy: user?.id,
			});

			if (res.data.success) {
				toast.success("Đã thêm tài liệu vào lớp");
				fetchData();
				setIsModalVisible(false);
			} else {
				toast.error(res.data.message || "Không thể thêm tài liệu");
			}
		} catch (err: any) {
			console.error("Lỗi khi gán tài liệu:", err);
			const errorMsg =
				err.response?.data?.message || "Lỗi server khi thêm tài liệu";
			toast.error(errorMsg);
		}
	};

	const handleToggleVisibility = async (
		materialId: number,
		checked: boolean
	) => {
		try {
			const res = await axios.patch(`${API_BASE}/materials/visibility`, {
				courseSectionId: sectionId,
				materialId,
				isOpen: checked,
			});
			if (res.data.success) {
				toast.success(`Đã ${checked ? "mở" : "đóng"} tài liệu`);
				setMaterials((prev) =>
					prev.map((m) =>
						m.materialId === materialId ? { ...m, isOpen: checked } : m
					)
				);
			} else {
				toast.error(res.data.message || "Không thể cập nhật trạng thái");
			}
		} catch (err: any) {
			console.error("Lỗi toggle visibility:", err);
			toast.error("Lỗi server khi cập nhật trạng thái");
		}
	};

	const handleView = (record: CourseMaterial) => {
		if (record.material.filePath) {
			window.open(
				`http://localhost:4000/${record.material.filePath}`,
				"_blank"
			);
		} else {
			toast.error("Tài liệu này chưa có file để xem");
		}
	};

	const handleDownload = (record: CourseMaterial) => {
		if (record.material.filePath && record.material.fileName) {
			const link = document.createElement("a");
			link.href = `http://localhost:4000/${record.material.filePath}`;
			link.download = record.material.fileName;
			link.click();
			toast.success("Đang tải xuống...");
		} else {
			toast.error("Tài liệu này chưa có file để tải");
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
		if (type?.includes("video")) return <Tag color="magenta">VIDEO</Tag>;
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
			dataIndex: ["material", "title"],
			key: "title",
			width: "30%",
			sorter: (a: CourseMaterial, b: CourseMaterial) =>
				a.material.title.localeCompare(b.material.title),
			render: (_: any, record: CourseMaterial) => (
				<div>
					<div style={{ fontWeight: 600, color: "#1890ff", marginBottom: 4 }}>
						<FileOutlined style={{ marginRight: 8 }} />
						{record.material.title}
					</div>
					{record.material.description && (
						<div style={{ fontSize: 12, color: "#666" }}>
							{record.material.description}
						</div>
					)}
				</div>
			),
		},
		{
			title: "File",
			key: "fileInfo",
			width: "20%",
			render: (_: any, record: CourseMaterial) => (
				<div>
					<div style={{ marginBottom: 4 }}>
						{record.material.fileName ? (
							<Tooltip title={record.material.fileName}>
								<span style={{ fontSize: 12, color: "#666" }}>
									{record.material.fileName.length > 30
										? record.material.fileName.substring(0, 30) + "..."
										: record.material.fileName}
								</span>
							</Tooltip>
						) : (
							<Tag color="red">Chưa có file</Tag>
						)}
					</div>
					<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
						{getFileTypeTag(record.material.fileType || "")}
						{record.material.fileSize && (
							<Tag color="default" style={{ margin: 0 }}>
								{formatFileSize(record.material.fileSize)}
							</Tag>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Người tải lên",
			key: "uploader",
			width: "15%",
			render: (_: any, record: CourseMaterial) => (
				<div>
					<div style={{ fontWeight: 500 }}>
						{record.material.uploader?.fullName || "Không rõ"}
					</div>
					{record.material.uploader?.email && (
						<div style={{ fontSize: 11, color: "#666" }}>
							{record.material.uploader.email}
						</div>
					)}
				</div>
			),
		},
		{
			title: "Ngày tải lên",
			dataIndex: ["material", "uploadedAt"],
			key: "uploadedAt",
			width: "12%",
			sorter: (a: CourseMaterial, b: CourseMaterial) =>
				new Date(a.material.uploadedAt).getTime() -
				new Date(b.material.uploadedAt).getTime(),
			render: (date: string) => (
				<div>
					<div>{dayjs(date).format("DD/MM/YYYY")}</div>
					<div style={{ fontSize: 11, color: "#666" }}>
						{dayjs(date).format("HH:mm")}
					</div>
				</div>
			),
		},
		{
			title: "Trạng thái",
			key: "status",
			width: "13%",
			align: "center" as const,
			render: (_: any, record: CourseMaterial) => (
				<Switch
					checkedChildren={
						<>
							<CheckCircleOutlined /> Hiển thị
						</>
					}
					unCheckedChildren={
						<>
							<EyeInvisibleOutlined /> Ẩn
						</>
					}
					checked={record.isOpen}
					onChange={(checked) =>
						handleToggleVisibility(record.materialId, checked)
					}
				/>
			),
		},
		{
			title: "Hành động",
			key: "actions",
			width: "10%",
			align: "center" as const,
			render: (_: any, record: CourseMaterial) => (
				<div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
					<Tooltip title="Xem tài liệu">
						<Button
							size="small"
							icon={<EyeOutlined />}
							onClick={() => handleView(record)}
							disabled={!record.material.filePath}
						/>
					</Tooltip>
					<Tooltip title="Tải xuống">
						<Button
							size="small"
							icon={<DownloadOutlined />}
							onClick={() => handleDownload(record)}
							disabled={!record.material.filePath}
						/>
					</Tooltip>
				</div>
			),
		},
	];

	// Columns cho modal thêm tài liệu
	const materialPickerColumns = [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			key: "title",
			width: "30%",
			render: (title: string, record: Material) => (
				<div>
					<div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
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
			width: "25%",
			render: (_: any, record: Material) => (
				<div>
					<div style={{ fontSize: 12, marginBottom: 4 }}>
						{record.fileName || "N/A"}
					</div>
					<div style={{ display: "flex", gap: 4 }}>
						{getFileTypeTag(record.fileType || "")}
						{record.fileSize && (
							<Tag>{formatFileSize(record.fileSize)}</Tag>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Người tải",
			key: "uploader",
			width: "20%",
			render: (_: any, record: Material) =>
				record.uploader?.fullName || "Không rõ",
		},
		{
			title: "Ngày tải",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: "15%",
			render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
		},
		{
			title: "",
			key: "action",
			width: "10%",
			align: "center" as const,
			render: (_: any, record: Material) => {
				const alreadyAdded = materials.some(
					(m) => m.materialId === record.id
				);
				return (
					<Button
						type="primary"
						size="small"
						icon={<PlusOutlined />}
						onClick={() => handleAssignMaterial(record.id)}
						disabled={alreadyAdded}
					>
						{alreadyAdded ? "Đã thêm" : "Thêm"}
					</Button>
				);
			},
		},
	];

	const filteredMaterials = materials.filter(
		(m) =>
			!keyword ||
			m.material.title.toLowerCase().includes(keyword.toLowerCase()) ||
			m.material.description?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.material.fileName?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.material.uploader?.fullName
				?.toLowerCase()
				.includes(keyword.toLowerCase())
	);

	const filteredPublicMaterials = publicMaterials.filter(
		(m) =>
			!searchPublic ||
			m.title.toLowerCase().includes(searchPublic.toLowerCase()) ||
			m.description?.toLowerCase().includes(searchPublic.toLowerCase()) ||
			m.fileName?.toLowerCase().includes(searchPublic.toLowerCase())
	);

	const filteredMyMaterials = myMaterials.filter(
		(m) =>
			!searchMy ||
			m.title.toLowerCase().includes(searchMy.toLowerCase()) ||
			m.description?.toLowerCase().includes(searchMy.toLowerCase()) ||
			m.fileName?.toLowerCase().includes(searchMy.toLowerCase())
	);

	const getStatistics = () => {
		const totalMaterials = materials.length;
		const visibleMaterials = materials.filter((m) => m.isOpen).length;
		const hiddenMaterials = totalMaterials - visibleMaterials;
		const totalFileSize = materials.reduce(
			(sum, m) => sum + (m.material.fileSize || 0),
			0
		);

		return {
			totalMaterials,
			visibleMaterials,
			hiddenMaterials,
			totalFileSize,
		};
	};

	const stats = getStatistics();

	if (loading)
		return (
			<div style={{ textAlign: "center", padding: 60 }}>
				<Spin size="large" tip="Đang tải danh sách tài liệu..." />
			</div>
		);

	return (
		<div style={{ padding: 16 }}>
			{/* Statistics Cards */}
			<Row gutter={16} style={{ marginBottom: 16 }}>
				<Col xs={24} sm={12} md={6}>
					<Card>
						<Statistic
							title="Tổng tài liệu"
							value={stats.totalMaterials}
							prefix={<FolderOpenOutlined />}
							valueStyle={{ color: "#1890ff" }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						<Statistic
							title="Đang hiển thị"
							value={stats.visibleMaterials}
							prefix={<CheckCircleOutlined />}
							valueStyle={{ color: "#52c41a" }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						<Statistic
							title="Đã ẩn"
							value={stats.hiddenMaterials}
							prefix={<EyeInvisibleOutlined />}
							valueStyle={{ color: "#faad14" }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						<Statistic
							title="Tổng dung lượng"
							value={formatFileSize(stats.totalFileSize)}
							prefix={<FileOutlined />}
							valueStyle={{ color: "#722ed1" }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Header + Search + Actions */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
					gap: 8,
					flexWrap: "wrap",
				}}
			>
				<Title level={4} style={{ margin: 0 }}>
					Tài liệu lớp học
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tiêu đề, mô tả, tên file, người tải..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 300 }}
					/>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={showAddModal}
					>
						Thêm tài liệu
					</Button>
					<Button icon={<ReloadOutlined />} onClick={fetchData}>
						Làm mới
					</Button>
				</div>
			</div>

			{/* Table */}
			{filteredMaterials.length === 0 ? (
				<Card style={{ textAlign: "center", padding: 40 }}>
					<Text type="secondary">
						{keyword
							? "Không tìm thấy tài liệu phù hợp"
							: "Chưa có tài liệu nào được thêm vào lớp"}
					</Text>
				</Card>
			) : (
				<Table<CourseMaterial>
					dataSource={filteredMaterials}
					columns={columns}
					rowKey="id"
					bordered
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Tổng ${total} tài liệu`,
						pageSizeOptions: ["10", "20", "50"],
					}}
					scroll={{ x: "max-content" }}
				/>
			)}

			{/* Modal thêm tài liệu */}
			<Modal
				title="Thêm tài liệu vào lớp"
				open={isModalVisible}
				onCancel={() => setIsModalVisible(false)}
				footer={null}
				width={1000}
				bodyStyle={{ padding: "16px 0" }}
			>
				<Tabs
					defaultActiveKey="my"
					items={[
						{
							key: "my",
							label: (
								<span>
									<FolderOpenOutlined /> Tài liệu của tôi
								</span>
							),
							children: (
								<div>
									<Input
										allowClear
										prefix={<SearchOutlined />}
										placeholder="Tìm trong tài liệu của tôi..."
										value={searchMy}
										onChange={(e) => setSearchMy(e.target.value)}
										style={{ marginBottom: 16 }}
									/>
									<Table<Material>
										dataSource={filteredMyMaterials}
										columns={materialPickerColumns}
										rowKey="id"
										loading={loadingMy}
										pagination={{ pageSize: 5 }}
										scroll={{ x: "max-content" }}
									/>
								</div>
							),
						},
						{
							key: "public",
							label: (
								<span>
									<GlobalOutlined /> Tài liệu công khai
								</span>
							),
							children: (
								<div>
									<div
										style={{
											display: "flex",
											gap: 8,
											marginBottom: 16,
										}}
									>
										<Input
											allowClear
											prefix={<SearchOutlined />}
											placeholder="Tìm trong tài liệu công khai..."
											value={searchPublic}
											onChange={(e) => setSearchPublic(e.target.value)}
											style={{ flex: 1 }}
										/>
										<Button
											icon={<ReloadOutlined />}
											onClick={fetchPublicMaterials}
										>
											Tìm kiếm
										</Button>
									</div>
									<Table<Material>
										dataSource={filteredPublicMaterials}
										columns={materialPickerColumns}
										rowKey="id"
										loading={loadingPublic}
										pagination={{ pageSize: 5 }}
										scroll={{ x: "max-content" }}
									/>
								</div>
							),
						},
					]}
				/>
			</Modal>
		</div>
	);
}