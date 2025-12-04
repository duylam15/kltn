import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	message,
	Tag,
	Modal,
	Input,
	Tooltip,
	Form,
	InputNumber,
	Switch,
	Popconfirm,
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	TeamOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	CheckCircleOutlined,
	UsergroupAddOutlined,
	UserOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import instance from "../../utils/axiosInstance";

const { Title } = Typography;

type Student = {
	id: number;
	studentCode: string;
	className: string;
	user: { fullName: string; email: string };
};

type Group = {
	id: number;
	sectionId: number;
	groupCode?: string | null;
	groupName?: string | null;
	maxMembers?: number | null;
	isActive?: boolean | null;
	createdAt?: string;
	updatedAt?: string;
	enrollments?: { student: Student }[];
};

export default function GroupList() {
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [loading, setLoading] = useState(true);
	const [groups, setGroups] = useState<Group[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal chi tiết
	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

	// modal thêm/sửa
	const [form] = Form.useForm<Group>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Group | null>(null);

	useEffect(() => {
		fetchGroups();
	}, [sectionId]);

	async function fetchGroups() {
		try {
			setLoading(true);
			const res = await instance.get<{ success: boolean; data: Group[] }>(
				`/sections-groups/sections/${sectionId}/groups`
			);
			if (res.data.success) {
				setGroups(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách nhóm");
		} finally {
			setLoading(false);
		}
	}

	const handleDelete = async (id: number) => {
		try {
			await instance.delete(`/sections-groups/${id}`);
			toast.success("Đã xóa nhóm");
			setGroups((prev) => prev.filter((g) => g.id !== id));
		} catch (err) {
			toast.error("Không thể xóa nhóm");
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			const payload = {
				sectionId,
				groupCode: values.groupCode?.trim() || null,
				groupName: values.groupName?.trim() || null,
				maxMembers: values.maxMembers ?? 6,
				isActive: values.isActive ?? true,
			};

			if (editing) {
				await instance.patch(`/sections-groups/${editing.id}`, payload);
				toast.success("Đã cập nhật nhóm");
			} else {
				await instance.post(`/sections-groups`, payload);
				toast.success("Đã thêm nhóm mới");
			}

			setModalOpen(false);
			setEditing(null);
			fetchGroups();
		} catch (err: any) {
			if (err?.errorFields) return; // lỗi validate form
			toast.error("Không thể lưu nhóm");
		}
	};

	const columns = [
		{
			title: "Mã nhóm",
			dataIndex: "groupCode",
			key: "groupCode",
			sorter: (a: Group, b: Group) => (a.groupCode || "").localeCompare(b.groupCode || ""),
			render: (text: string) => text || <Tag color="default">N/A</Tag>,
		},
		{
			title: "Tên nhóm",
			dataIndex: "groupName",
			key: "groupName",
			sorter: (a: Group, b: Group) => (a.groupName || "").localeCompare(b.groupName || ""),
			render: (text: string) => text || <Tag color="default">Chưa đặt</Tag>,
			responsive: ["sm"] as any,
		},
		{
			title: "Số TV",
			key: "membersCount",
			align: "center" as const,
			sorter: (a: Group, b: Group) =>
				(a.enrollments?.length || 0) - (b.enrollments?.length || 0),
			render: (_: any, record: Group) => record.enrollments?.length || 0,
		},
		{
			title: "Tối đa",
			dataIndex: "maxMembers",
			key: "maxMembers",
			align: "center" as const,
			sorter: (a: Group, b: Group) => (a.maxMembers || 0) - (b.maxMembers || 0),
			render: (num: number) => num || 6,
			responsive: ["md"] as any,
		},
		{
			title: "Trạng thái",
			dataIndex: "isActive",
			key: "isActive",
			align: "center" as const,
			sorter: (a: Group, b: Group) =>
				Number(Boolean(a.isActive)) - Number(Boolean(b.isActive)),
			render: (v: boolean) =>
				v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
			responsive: ["lg"] as any,
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			sorter: (a: Group, b: Group) =>
				new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
			responsive: ["xl"] as any,
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			fixed: "right" as const,
			width: 140,
			render: (_: any, record: Group) => (
				<div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
					<Tooltip title="Xem chi tiết">
						<Button
							icon={<TeamOutlined />}
							size="small"
							onClick={() => {
								setSelectedGroup(record);
								setDetailOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => {
								setEditing(record);
								form.setFieldsValue(record);
								setModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa nhóm"
							description="Bạn có chắc muốn xóa nhóm này?"
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

	const filteredGroups = groups.filter(
		(g) =>
			!keyword ||
			g.groupName?.toLowerCase().includes(keyword.toLowerCase()) ||
			g.groupCode?.toLowerCase().includes(keyword.toLowerCase())
	);

	const getStatistics = () => {
		const totalGroups = groups.length;
		const activeGroups = groups.filter((g) => g.isActive).length;
		const totalMembers = groups.reduce(
			(sum, g) => sum + (g.enrollments?.length || 0),
			0
		);
		const fullGroups = groups.filter(
			(g) => (g.enrollments?.length || 0) >= (g.maxMembers || 6)
		).length;
		const emptyGroups = groups.filter(
			(g) => !g.enrollments || g.enrollments.length === 0
		).length;
		const avgFillRate =
			totalGroups > 0
				? groups.reduce((sum, g) => {
					const current = g.enrollments?.length || 0;
					const max = g.maxMembers || 6;
					return sum + (current / max) * 100;
				}, 0) / totalGroups
				: 0;

		return {
			totalGroups,
			activeGroups,
			totalMembers,
			fullGroups,
			emptyGroups,
			avgFillRate,
		};
	};

	const stats = getStatistics();

	return (
		<div style={{ padding: "16px" }}>
			<style>
				{`
					@media (max-width: 768px) {
						.stats-container {
							display: none ! important;
						}
						
						.header-actions {
							flex-direction: column;
							gap: 8px ! important;
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
					}
					
					@media (min-width: 769px) and (max-width: 1024px) {
						.stats-container > div:nth-child(n+4) {
							display: none ! important;
						}
					}
				`}
			</style>

			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: 16,
					marginTop: -16,
					flexWrap: "wrap",
					gap: 12,
				}}
			>
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
						<UsergroupAddOutlined style={{ fontSize: 14, color: "#1890ff" }} />
						<span>Tổng nhóm:</span>
						<strong>{stats.totalGroups}</strong>
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
						<CheckCircleOutlined style={{ fontSize: 14, color: "#52c41a" }} />
						<span>Kích hoạt:</span>
						<strong style={{ color: "#52c41a" }}>{stats.activeGroups}</strong>
						<span style={{ fontSize: 11, color: "#888" }}>
							/ {stats.totalGroups}
						</span>
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
						<TeamOutlined
							style={{
								fontSize: 14,
								color: stats.fullGroups > 0 ? "#fa8c16" : "#52c41a",
							}}
						/>
						<span>Nhóm đầy:</span>
						<strong
							style={{
								color: stats.fullGroups > 0 ? "#fa8c16" : "#52c41a",
							}}
						>
							{stats.fullGroups}
						</strong>
					</div>

					{stats.emptyGroups > 0 && (
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
							<WarningOutlined style={{ fontSize: 14, color: "#ff4d4f" }} />
							<span>Nhóm trống:</span>
							<strong style={{ color: "#ff4d4f" }}>{stats.emptyGroups}</strong>
						</div>
					)}
				</div>

				<div
					className="header-actions"
					style={{
						display: "flex",
						gap: 8,
						alignItems: "center",
					}}
				>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm mã/tên..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						className="search-input"
						style={{ width: 180 }}
					/>
					<div className="action-buttons" style={{ display: "flex", gap: 8 }}>
						<Button icon={<ReloadOutlined />} onClick={fetchGroups}>
							<span className="btn-text">Refresh</span>
						</Button>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => {
								setEditing(null);
								form.resetFields();
								setModalOpen(true);
							}}
						>
							<span className="btn-text">Thêm</span>
						</Button>
					</div>
				</div>
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: "40px 0" }}>
					<Spin tip="Đang tải..." />
				</div>
			) : (
				<Table<Group>
					dataSource={filteredGroups}
					columns={columns}
					rowKey="id"
					bordered
					pagination={{
						pageSize: 5,
						showSizeChanger: true,
						showTotal: (total) => `Tổng ${total} nhóm`,
						responsive: true,
					}}
					scroll={{ x: 800 }}
				/>
			)}

			{/* Modal chi tiết thành viên */}
			<Modal
				title={`Chi tiết nhóm ${selectedGroup?.groupName || selectedGroup?.groupCode || ""
					}`}
				open={detailOpen}
				onCancel={() => setDetailOpen(false)}
				footer={[
					<Button key="close" type="primary" onClick={() => setDetailOpen(false)}>
						Đóng
					</Button>
				]}
				width={700}
				style={{ maxWidth: "calc(100vw - 32px)" }}
			>
				<Table
					dataSource={selectedGroup?.enrollments || []}
					rowKey={(row) => row.student.id}
					columns={[
						{
							title: "MSSV",
							dataIndex: ["student", "studentCode"],
							key: "code",
							width: 120,
						},
						{
							title: "Họ tên",
							dataIndex: ["student", "user", "fullName"],
							key: "name",
							responsive: ["sm"] as any,
						},
						{
							title: "Email",
							dataIndex: ["student", "user", "email"],
							key: "email",
							responsive: ["md"] as any,
						},
						{
							title: "Lớp",
							dataIndex: ["student", "className"],
							key: "class",
							width: 100,
						},
					]}
					pagination={false}
					bordered
					scroll={{ x: 600 }}
				/>
			</Modal>

			{/* Modal thêm/sửa */}
			<Modal
				title={editing ? "Sửa nhóm" : "Thêm nhóm"}
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tạo mới"}
				cancelText="Hủy"
				style={{ maxWidth: "calc(100vw - 32px)" }}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					overflowY: "auto",
					overflowX: "hidden",
				}}
			>
				<Form
					form={form}
					layout="vertical"
					initialValues={{ maxMembers: 6, isActive: true }}
				>
					<Form.Item label="Mã nhóm" name="groupCode">
						<Input placeholder="VD: G01" />
					</Form.Item>
					<Form.Item label="Tên nhóm" name="groupName">
						<Input placeholder="VD: Nhóm thảo luận 1" />
					</Form.Item>
					<Form.Item label="Tối đa thành viên" name="maxMembers">
						<InputNumber min={1} max={1000} style={{ width: "100%" }} />
					</Form.Item>
					<Form.Item label="Kích hoạt" name="isActive" valuePropName="checked">
						<Switch />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}