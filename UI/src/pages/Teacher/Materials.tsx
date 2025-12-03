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
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;

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
			const res = await instance.get(`/materials/class/${sectionId}`);

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

	const fetchPublicMaterials = async () => {
		try {
			setLoadingPublic(true);
			const res = await instance.get(`/materials/public`, {
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

	const fetchMyMaterials = async () => {
		try {
			setLoadingMy(true);
			const res = await instance.get(`/materials/teacher/${user?.id}`);

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

	const showAddModal = () => {
		setIsModalVisible(true);
		fetchPublicMaterials();
		fetchMyMaterials();
	};

	const handleAssignMaterial = async (materialId: number) => {
		try {
			const res = await instance.post(`/materials/assign`, {
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
			const res = await instance.patch(`/materials/visibility`, {
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
			width: 250,
			fixed: "left" as const,
			sorter: (a: CourseMaterial, b: CourseMaterial) =>
				a.material.title.localeCompare(b.material.title),
			render: (_: any, record: CourseMaterial) => (
				<div>
					<div style={{ fontWeight: 600, color: "#1890ff", marginBottom: 4, fontSize: 14 }}>
						<FileOutlined style={{ marginRight: 8 }} />
						{record.material.title}
					</div>
					{record.material.description && (
						<div style={{ fontSize: 12, color: "#666" }}>
							{record.material.description.length > 50
								? record.material.description.substring(0, 50) + "..."
								: record.material.description}
						</div>
					)}
				</div>
			),
		},
		{
			title: "File",
			key: "fileInfo",
			width: 180,
			render: (_: any, record: CourseMaterial) => (
				<div>
					<div style={{ marginBottom: 4 }}>
						{record.material.fileName ? (
							<Tooltip title={record.material.fileName}>
								<span style={{ fontSize: 12, color: "#666" }}>
									{record.material.fileName.length > 25
										? record.material.fileName.substring(0, 25) + "..."
										: record.material.fileName}
								</span>
							</Tooltip>
						) : (
							<Tag color="red">Chưa có file</Tag>
						)}
					</div>
					<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
						{getFileTypeTag(record.material.fileType || "")}
						{record.material.fileSize && (
							<Tag color="default" style={{ margin: 0, fontSize: 11 }}>
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
			width: 150,
			render: (_: any, record: CourseMaterial) => (
				<div>
					<div style={{ fontWeight: 500, fontSize: 13 }}>
						{record.material.uploader?.fullName || "Không rõ"}
					</div>
					{record.material.uploader?.email && (
						<div style={{ fontSize: 11, color: "#666" }}>
							{record.material.uploader.email.length > 20
								? record.material.uploader.email.substring(0, 20) + "..."
								: record.material.uploader.email}
						</div>
					)}
				</div>
			),
		},
		{
			title: "Ngày tải lên",
			dataIndex: ["material", "uploadedAt"],
			key: "uploadedAt",
			width: 110,
			sorter: (a: CourseMaterial, b: CourseMaterial) =>
				new Date(a.material.uploadedAt).getTime() -
				new Date(b.material.uploadedAt).getTime(),
			render: (date: string) => (
				<div>
					<div style={{ fontSize: 12 }}>{dayjs(date).format("DD/MM/YYYY")}</div>
					<div style={{ fontSize: 11, color: "#666" }}>
						{dayjs(date).format("HH:mm")}
					</div>
				</div>
			),
		},
		{
			title: "Trạng thái",
			key: "status",
			width: 110,
			align: "center" as const,
			render: (_: any, record: CourseMaterial) => (
				<Switch
					checkedChildren={<CheckCircleOutlined />}
					unCheckedChildren={<EyeInvisibleOutlined />}
					checked={record.isOpen}
					onChange={(checked) =>
						handleToggleVisibility(record.materialId, checked)
					}
					size="small"
				/>
			),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 100,
			align: "center" as const,
			render: (_: any, record: CourseMaterial) => (
				<div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
					<Tooltip title="Xem">
						<Button
							size="small"
							icon={<EyeOutlined />}
							onClick={() => handleView(record)}
							disabled={!record.material.filePath}
						/>
					</Tooltip>
				</div>
			),
		},
	];

	const materialPickerColumns = [
		{
			title: "Tiêu đề",
			dataIndex: "title",
			key: "title",
			width: 250,
			render: (title: string, record: Material) => (
				<div>
					<div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{title}</div>
					{record.description && (
						<div style={{ fontSize: 11, color: "#666" }}>
							{record.description.length > 40
								? record.description.substring(0, 40) + "..."
								: record.description}
						</div>
					)}
				</div>
			),
		},
		{
			title: "File",
			key: "file",
			width: 180,
			render: (_: any, record: Material) => (
				<div>
					<div style={{ fontSize: 11, marginBottom: 4 }}>
						{record.fileName ? (
							record.fileName.length > 25
								? record.fileName.substring(0, 25) + "..."
								: record.fileName
						) : "N/A"}
					</div>
					<div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
						{getFileTypeTag(record.fileType || "")}
						{record.fileSize && (
							<Tag style={{ fontSize: 10 }}>{formatFileSize(record.fileSize)}</Tag>
						)}
					</div>
				</div>
			),
		},
		{
			title: "Người tải",
			key: "uploader",
			width: 130,
			render: (_: any, record: Material) => (
				<span style={{ fontSize: 12 }}>
					{record.uploader?.fullName || "Không rõ"}
				</span>
			),
		},
		{
			title: "Ngày tải",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: 100,
			render: (date: string) => (
				<span style={{ fontSize: 11 }}>{dayjs(date).format("DD/MM/YYYY")}</span>
			),
		},
		{
			title: "",
			key: "action",
			width: 90,
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
		<div className="materials-container" style={{ padding: "8px 12px" }}>
			<style>
				{`
	/* MOBILE (<=768px) */
	@media (max-width: 768px) {

		/* Ẩn stats row */
		.stats-row {
			display: none !important;
		}

		.materials-title {
			font-size: 16px !important;
			margin: 0 0 12px 0 !important;
		}

		.header-actions {
			flex-direction: column !important;
			gap: 8px !important;
			width: 100%;
		}

		.search-input {
			width: 100% !important;
		}

		.action-buttons {
			width: 100%;
			display: flex;
			gap: 8px;
		}

		.action-buttons button {
			flex: 1;
		}

		.ant-modal {
			max-width: calc(100vw - 16px) !important;
			margin: 8px !important;
		}

		/* Vuốt ngang table */
		.ant-table-wrapper::after {
			content: "← Vuốt để xem thêm →";
			display: block;
			text-align: center;
			font-size: 11px;
			color: #999;
			padding: 8px 0 4px;
			font-style: italic;
		}

		.ant-statistic-title {
			font-size: 12px !important;
		}

		.ant-statistic-content {
			font-size: 18px !important;
		}
	}

	/* TABLET (769px - 1024px) */
	@media (min-width: 769px) and (max-width: 1024px) {
		.search-input {
			width: 220px !important;
		}
	}

	/* DESKTOP (>1024px) */
	@media (min-width: 1025px) {
		.materials-container {
			padding: 16px !important;
		}
	}

	/* Scrollbar Table */
	.ant-table-body::-webkit-scrollbar {
		height: 8px;
	}

	.ant-table-body::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4px;
	}

	.ant-table-body::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 4px;
	}

	.ant-table-body::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
`}
			</style>

			{/* Header + Search + Actions */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: 16,
					marginTop: -16,
					gap: 12,
					flexWrap: "wrap",
				}}
			>
				{/* === NEW: Thay Title bằng các STATISTICS NHỎ === */}
				<div
					className="header-mini-stats hide-on-mobile"
					style={{
						display: "flex",
						gap: 8,
						flexWrap: "wrap",
						alignItems: "center",
						flex: "1 1 auto",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: 12,
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
							border: "1px solid #ddd",
							borderRadius: 6,
							padding: "6px 10px",
							background: "#fff",
							whiteSpace: "nowrap",
						}}
					>
						<CheckCircleOutlined style={{ fontSize: 14, color: "#52c41a" }} />
						<span>Đang hiển thị:</span>
						<strong style={{ color: "#52c41a" }}>{stats.visibleMaterials}</strong>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: 12,
							border: "1px solid #ddd",
							borderRadius: 6,
							padding: "6px 10px",
							background: "#fff",
							whiteSpace: "nowrap",
						}}
					>
						<EyeInvisibleOutlined style={{ fontSize: 14, color: "#faad14" }} />
						<span>Đã ẩn:</span>
						<strong style={{ color: "#faad14" }}>{stats.hiddenMaterials}</strong>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							fontSize: 12,
							border: "1px solid #ddd",
							borderRadius: 6,
							padding: "6px 10px",
							background: "#fff",
							whiteSpace: "nowrap",
						}}
					>
						<FileOutlined style={{ fontSize: 14, color: "#722ed1" }} />
						<span>Dung lượng:</span>
						<strong style={{ color: "#722ed1" }}>
							{formatFileSize(stats.totalFileSize)}
						</strong>
					</div>
				</div>

				{/* SEARCH + ACTIONS */}
				<div
					className="header-actions"
					style={{
						display: "flex",
						gap: 8,
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm kiếm..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						className="search-input"
						style={{ width: 250 }}
					/>

					<div className="action-buttons" style={{ display: "flex", gap: 8 }}>
						<Button icon={<ReloadOutlined />} onClick={fetchData}>
							<span className="btn-text">Làm mới</span>
						</Button>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={showAddModal}
						>
							<span className="btn-text">Thêm</span>
						</Button>
					</div>
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
				<div style={{ overflowX: "auto" }}>
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
							responsive: true,
						}}
						scroll={{ x: 900 }}
						size="middle"
					/>
				</div>
			)}

			{/* Modal thêm tài liệu */}
			<Modal
				title="Thêm tài liệu vào lớp"
				open={isModalVisible}
				onCancel={() => setIsModalVisible(false)}
				footer={null}
				width={1000}
				style={{ maxWidth: "calc(100vw - 16px)" }}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Tabs
					defaultActiveKey="my"
					items={[
						{
							key: "my",
							label: (
								<span>
									<FolderOpenOutlined /> Của tôi
								</span>
							),
							children: (
								<div style={{ padding: "0 16px" }}>
									<Input
										allowClear
										prefix={<SearchOutlined />}
										placeholder="Tìm trong tài liệu của tôi..."
										value={searchMy}
										onChange={(e) => setSearchMy(e.target.value)}
										style={{ marginBottom: 16 }}
									/>
									<div style={{ overflowX: "auto" }}>
										<Table<Material>
											dataSource={filteredMyMaterials}
											columns={materialPickerColumns}
											rowKey="id"
											loading={loadingMy}
											pagination={{ pageSize: 5, responsive: true }}
											scroll={{ x: 750 }}
											size="small"
										/>
									</div>
								</div>
							),
						},
						{
							key: "public",
							label: (
								<span>
									<GlobalOutlined /> Công khai
								</span>
							),
							children: (
								<div style={{ padding: "0 16px" }}>
									<div
										style={{
											display: "flex",
											gap: 8,
											marginBottom: 16,
											flexWrap: "wrap",
										}}
									>
										<Input
											allowClear
											prefix={<SearchOutlined />}
											placeholder="Tìm trong tài liệu công khai..."
											value={searchPublic}
											onChange={(e) => setSearchPublic(e.target.value)}
											style={{ flex: 1, minWidth: 200 }}
										/>
										<Button
											icon={<ReloadOutlined />}
											onClick={fetchPublicMaterials}
										>
											Tìm kiếm
										</Button>
									</div>
									<div style={{ overflowX: "auto" }}>
										<Table<Material>
											dataSource={filteredPublicMaterials}
											columns={materialPickerColumns}
											rowKey="id"
											loading={loadingPublic}
											pagination={{ pageSize: 5, responsive: true }}
											scroll={{ x: 750 }}
											size="small"
										/>
									</div>
								</div>
							),
						},
					]}
				/>
			</Modal>
		</div>
	);
}