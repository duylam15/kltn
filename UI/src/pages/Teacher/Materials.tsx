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
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";

const { Title, Text } = Typography;
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
	isOpen: boolean;
	uploader?: {
		fullName: string;
		email: string;
	};
};

export default function Materials() {
	const { user } = useAuth();
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [loading, setLoading] = useState(true);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [keyword, setKeyword] = useState("");

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

	const handleToggleVisibility = async (materialId: number, checked: boolean) => {
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

	const handleView = (material: Material) => {
		if (material.filePath) {
			window.open(`http://localhost:4000/${material.filePath}`, "_blank");
		} else {
			toast.error("Tài liệu này chưa có file để xem");
		}
	};

	const handleDownload = (material: Material) => {
		if (material.filePath && material.fileName) {
			const link = document.createElement("a");
			link.href = `http://localhost:4000/${material.filePath}`;
			link.download = material.fileName;
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
			dataIndex: "title",
			key: "title",
			width: "30%",
			sorter: (a: Material, b: Material) => a.title.localeCompare(b.title),
			render: (text: string, record: Material) => (
				<div>
					<div style={{ fontWeight: 600, color: "#1890ff", marginBottom: 4 }}>
						<FileOutlined style={{ marginRight: 8 }} />
						{text}
					</div>
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
			key: "fileInfo",
			width: "20%",
			render: (_: any, record: Material) => (
				<div>
					<div style={{ marginBottom: 4 }}>
						{record.fileName ? (
							<Tooltip title={record.fileName}>
								<span style={{ fontSize: 12, color: "#666" }}>
									{record.fileName.length > 30
										? record.fileName.substring(0, 30) + "..."
										: record.fileName}
								</span>
							</Tooltip>
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
			title: "Người tải lên",
			key: "uploader",
			width: "15%",
			render: (_: any, record: Material) => (
				<div>
					<div style={{ fontWeight: 500 }}>
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
			title: "Ngày tải lên",
			dataIndex: "uploadedAt",
			key: "uploadedAt",
			width: "12%",
			sorter: (a: Material, b: Material) =>
				new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
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
			render: (_: any, record: Material) => (
				<Switch
					checkedChildren={<><CheckCircleOutlined /> Hiển thị</>}
					unCheckedChildren={<><EyeInvisibleOutlined /> Ẩn</>}
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
					<Tooltip title="Tải xuống">
						<Button
							size="small"
							icon={<DownloadOutlined />}
							onClick={() => handleDownload(record)}
							disabled={!record.filePath}
						/>
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
			m.fileName?.toLowerCase().includes(keyword.toLowerCase()) ||
			m.uploader?.fullName?.toLowerCase().includes(keyword.toLowerCase())
	);

	const getStatistics = () => {
		const totalMaterials = materials.length;
		const visibleMaterials = materials.filter((m) => m.isOpen).length;
		const hiddenMaterials = totalMaterials - visibleMaterials;
		const totalFileSize = materials.reduce(
			(sum, m) => sum + (m.fileSize || 0),
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
				<Table<Material>
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
		</div>
	);
}