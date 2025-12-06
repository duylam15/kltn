import React, { useEffect, useState, type JSX } from "react";
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
	Popconfirm,
	Select,
	Divider,
	Flex,  // ✅ Thêm
	Space,  // ✅ Thêm
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	KeyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from 'react-hot-toast';
import { useAuth } from "../../context/authContext";
import { User } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title } = Typography;
const { TextArea } = Input;

type Permission = {
	id: number;
	name: string;
	description: string;
	groupName: string;
	createdAt: string;
};

type RolePermission = {
	roleId: number;
	permissionId: number;
	permission: Permission;
};

type Role = {
	id: number;
	name: string;
	description: string;
	permissions: RolePermission[];
	createdAt?: string;
	updatedAt?: string;
};

// Custom Checkbox Component
interface CustomCheckboxProps {
	checked: boolean;
	indeterminate?: boolean;
	onChange: (checked: boolean) => void;
	children?: React.ReactNode;
	style?: React.CSSProperties;
	disabled?: boolean;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
	checked,
	indeterminate = false,
	onChange,
	children,
	style,
	disabled = false,
}) => {
	const handleClick = () => {
		if (!disabled) {
			onChange(!checked);
		}
	};

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'flex-start',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.6 : 1,
				...style,
			}}
			onClick={handleClick}
		>
			<div
				style={{
					width: 16,
					height: 16,
					border: '2px solid #d9d9d9',
					borderRadius: 2,
					marginRight: 8,
					marginTop: 2,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: checked ? '#1890ff' : 'white',
					borderColor: checked || indeterminate ? '#1890ff' : '#d9d9d9',
					position: 'relative',
				}}
			>
				{checked && (
					<svg
						width="10"
						height="8"
						viewBox="0 0 10 8"
						fill="none"
						style={{ color: 'white' }}
					>
						<path
							d="M9 1L3.5 6.5L1 4"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
				{indeterminate && !checked && (
					<div
						style={{
							width: 8,
							height: 2,
							backgroundColor: '#1890ff',
							borderRadius: 1,
						}}
					/>
				)}
			</div>
			<div style={{ flex: 1 }}>{children}</div>
		</div>
	);
};

export default function RolesAdmin() {
	const [loading, setLoading] = useState(true);
	const [roles, setRoles] = useState<Role[]>([]);
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal chi tiết permissions
	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);

	// modal thêm/sửa
	const [form] = Form.useForm<Role>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Role | null>(null);

	// Custom state for permission selection
	const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
	const { hasPermission } = useAuth();

	useEffect(() => {
		fetchRoles();
		fetchPermissions();
	}, []);

	async function fetchRoles() {
		try {
			setLoading(true);
			const res = await instance.get<{ success: boolean; data: Role[] }>(
				`/roles`
			);
			if (res.data.success) {
				setRoles(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách vai trò");
		} finally {
			setLoading(false);
		}
	}

	async function fetchPermissions() {
		try {
			const res = await instance.get<{ success: boolean; data: Permission[] }>(
				`/permissions`
			);
			if (res.data.success) {
				setPermissions(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách quyền");
		}
	}

	const handleDelete = async (id: number) => {
		try {
			await instance.delete(`/roles/${id}`);
			toast.success("Đã xóa vai trò");
			setRoles((prev) => prev.filter((r) => r.id !== id));
		} catch (err) {
			toast.error("Không thể xóa vai trò");
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			const payload = {
				name: values.name?.trim(),
				description: values.description?.trim(),
				permissions: selectedPermissions,
			};

			if (editing) {
				const res = await instance.put(`/roles/${editing.id}`, payload);
				toast.success('Successfully created! ');
				console.log(res);
			} else {
				await instance.post(`/roles`, payload);
				toast.success("🎉 Đã thêm vai trò mới");
			}

			setModalOpen(false);
			setEditing(null);
			setSelectedPermissions([]);
			fetchRoles();
		} catch (err: any) {
			if (err?.errorFields) return;
			toast.error("❌ Không thể lưu vai trò");
		}
	};

	// Group permissions by groupName
	const groupedPermissions = permissions.reduce((acc, permission) => {
		const group = permission.groupName || 'Other';
		if (!acc[group]) {
			acc[group] = [];
		}
		acc[group].push(permission);
		return acc;
	}, {} as Record<string, Permission[]>);

	// Handle permission selection
	const handlePermissionChange = (permissionId: number, checked: boolean) => {
		if (checked) {
			setSelectedPermissions(prev => [...prev, permissionId]);
		} else {
			setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
		}
	};

	// Handle group selection
	const handleGroupSelectAll = (groupPermissionIds: number[], checked: boolean) => {
		if (checked) {
			setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
		} else {
			setSelectedPermissions(prev => prev.filter(id => !groupPermissionIds.includes(id)));
		}
	};

	// Check if all permissions in group are selected
	const isGroupAllSelected = (groupPermissionIds: number[]) => {
		return groupPermissionIds.length > 0 && groupPermissionIds.every(id => selectedPermissions.includes(id));
	};

	// Check if some permissions in group are selected (indeterminate state)
	const isGroupIndeterminate = (groupPermissionIds: number[]) => {
		return groupPermissionIds.some(id => selectedPermissions.includes(id)) && !isGroupAllSelected(groupPermissionIds);
	};

	const columns = [
		{
			title: "Tên vai trò",
			dataIndex: "name",
			key: "name",
			width: 150,  // ✅ Thêm width
			sorter: (a: Role, b: Role) => a.name.localeCompare(b.name),
			render: (text: string) => <strong>{text}</strong>,
		},
		{
			title: "Mô tả",
			dataIndex: "description",
			key: "description",
			width: 300,  // ✅ Thêm width
			sorter: (a: Role, b: Role) => (a.description || "").localeCompare(b.description || ""),
			render: (text: string) => text || <Tag color="default">Chưa có mô tả</Tag>,
		},
		{
			title: "Số quyền",
			key: "permissionsCount",
			align: "center" as const,
			width: 120,  // ✅ Thêm width
			sorter: (a: Role, b: Role) =>
				(a.permissions?.length || 0) - (b.permissions?.length || 0),
			render: (_: any, record: Role) => (
				<Tag color="blue">{record.permissions?.length || 0} quyền</Tag>
			),
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			width: 150,  // ✅ Thêm width
			sorter: (a: Role, b: Role) =>
				new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			width: 150,  // ✅ Thêm width
			fixed: "right" as const,  // ✅ Thêm fixed
			render: (_: any, record: Role) => (
				<Space size="small">  {/* ✅ Đổi từ div sang Space */}
					<Tooltip title="Xem quyền">
						<Button
							icon={<KeyOutlined />}
							size="small"
							onClick={() => {
								setSelectedRole(record);
								setDetailOpen(true);
							}}
						/>
					</Tooltip>
					{hasPermission("role:update") && (
						<Tooltip title="Sửa">
							<Button
								icon={<EditOutlined />}
								size="small"
								onClick={() => {
									setEditing(record);
									form.setFieldsValue({
										...record,
									});
									const currentPermissionIds = record.permissions?.map(p => p.permission.id) || [];
									setSelectedPermissions(currentPermissionIds);
									setModalOpen(true);
								}}
							/>
						</Tooltip>
					)}
					{hasPermission("role:delete") && (
						<Tooltip title="Xóa">
							<Popconfirm
								title="Xóa vai trò"
								description="Bạn có chắc muốn xóa vai trò này?"
								okText="Xóa"
								cancelText="Hủy"
								okButtonProps={{ danger: true }}
								onConfirm={() => handleDelete(record.id)}
							>
								<Button danger size="small" icon={<DeleteOutlined />} />
							</Popconfirm>
						</Tooltip>
					)}
				</Space>
			),
		},
	];

	const filteredRoles = roles.filter(
		(r) =>
			!keyword ||
			r.name?.toLowerCase().includes(keyword.toLowerCase()) ||
			r.description?.toLowerCase().includes(keyword.toLowerCase())
	);

	return (
		<div className="sm:px-3 h-[1100px] sm:h-auto">  {/* ✅ Đổi className */}
			{/* 🎯 RESPONSIVE HEADER */}
			<Flex
				wrap="wrap"
				gap={12}
				className="flex-col sm:flex-row items-start sm:items-center w-full pt-3 pb-5"
			>
				{/* Title Left */}
				<Title level={3} style={{ margin: 0 }}>
					<Flex align="center" gap={8}>
						<User />
						<span>Quản lý Vai trò</span>
					</Flex>
				</Title>

				{/* Action Right */}
				<Flex
					gap={8}
					wrap="wrap"
					className="w-full sm:w-auto sm:ml-auto"
				>
					{/* Search */}
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tên vai trò..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						className="w-full sm:w-72"
					/>

					{/* Buttons */}
					<Flex gap={8} wrap="wrap">
						<Button icon={<ReloadOutlined />} onClick={fetchRoles}>
							<span className="hidden sm:inline">Refresh</span>
						</Button>
						{hasPermission("role:create") && (
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={() => {
									setEditing(null);
									form.resetFields();
									setSelectedPermissions([]);
									setModalOpen(true);
								}}
							>
								<span className="hidden sm:inline">Thêm vai trò</span>
								<span className="inline sm:hidden">Thêm</span>
							</Button>
						)}
					</Flex>
				</Flex>
			</Flex>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải..." />
				</div>
			) : (
				<div style={{ overflowX: "auto" }}>  {/* ✅ Thêm wrapper */}
					<Table<Role>
						dataSource={filteredRoles}
						columns={columns}
						rowKey="id"
						bordered
						pagination={{
							pageSize: 10,
							showSizeChanger: true,
							showTotal: (total) => `Tổng ${total} vai trò`,
							pageSizeOptions: ["10", "20", "50"],
							position: ["bottomRight"],
							style: { marginTop: 16 },
						}}
						locale={{ emptyText: "Không có vai trò nào" }}
						scroll={{ x: 1000 }} 
					/>
				</div>
			)}

			{/* Modal chi tiết quyền */}
			<Modal
				title={`Chi tiết quyền - ${selectedRole?.name}`}
				open={detailOpen}
				onCancel={() => setDetailOpen(false)}
				footer={null}
				width={800}
			>
				{selectedRole?.permissions && selectedRole.permissions.length > 0 ? (
					<div>
						{Object.entries(
							selectedRole.permissions.reduce((acc, rolePermission) => {
								const permission = rolePermission.permission;
								const group = permission.groupName || 'Other';
								if (!acc[group]) {
									acc[group] = [];
								}
								acc[group].push(permission);
								return acc;
							}, {} as Record<string, Permission[]>)
						).map(([groupName, perms]) => (
							<div key={groupName} style={{ marginBottom: 16 }}>
								<Title level={5} style={{ color: '#1890ff' }}>
									{groupName}
								</Title>
								<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
									{perms.map((permission) => (
										<Tag key={permission.id} color="green">
											{permission.name}
										</Tag>
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<p style={{ textAlign: 'center', color: '#999' }}>
						Vai trò này chưa có quyền nào
					</p>
				)}
			</Modal>

			{/* Modal thêm/sửa */}
			<Modal
				title={editing ? "Sửa vai trò" : "Thêm vai trò"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setSelectedPermissions([]);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tạo mới"}
				width="80%"
				centered
				bodyStyle={{ maxHeight: "80vh", overflowY: "hidden", overflowX: "hidden" }}
			>
				<Form
					form={form}
					layout="vertical"
					className="w-full max-w-8xl mx-auto"
				>
					{/* Chia grid 12 cột */}
					<div className="grid grid-cols-12 gap-6">
						{/* Cột trái: chiếm 2/12 */}
						<div className="col-span-12 md:col-span-2">
							<Form.Item
								label="Tên vai trò"
								name="name"
								rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}
							>
								<Input placeholder="VD: admin, teacher, student..." />
							</Form.Item>
							<Form.Item label="Mô tả" name="description">
								<TextArea rows={3} placeholder="Mô tả về vai trò này..." />
							</Form.Item>
						</div>

						{/* Cột phải: chiếm 8/12 */}
						<Form.Item
							label="Phân quyền"
							className="col-span-12 md:col-span-10"
						>
							<div
								style={{
									maxHeight: 500,
									overflowY: "auto",
									border: "1px solid #d9d9d9",
									padding: 20,
									borderRadius: 8,
									backgroundColor: "#fafafa",
									minWidth: "100%",
								}}
							>
								{Object.entries(groupedPermissions).map(
									([groupName, perms], groupIndex) => {
										const groupPermissionIds = perms.map((p) => p.id);
										const isAllSelected = isGroupAllSelected(groupPermissionIds);
										const isIndeterminate = isGroupIndeterminate(groupPermissionIds);

										return (
											<div key={groupName} style={{ marginBottom: 20 }}>
												{/* Header group */}
												<div
													style={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														marginBottom: 14,
														padding: "10px 14px",
														backgroundColor: "#e6f7ff",
														borderRadius: 6,
														border: "1px solid #91d5ff",
													}}
												>
													<Title level={5} style={{ margin: 0, color: "#1890ff" }}>
														{groupName}
													</Title>
													<CustomCheckbox
														indeterminate={isIndeterminate}
														checked={isAllSelected}
														onChange={(checked) =>
															handleGroupSelectAll(groupPermissionIds, checked)
														}
														style={{ fontSize: 13 }}
													>
														<span style={{ fontSize: 13, fontWeight: 500 }}>
															Chọn tất cả
														</span>
													</CustomCheckbox>
												</div>

												{/* Grid permissions */}
												<div
													style={{
														display: "grid",
														gridTemplateColumns:
															"repeat(auto-fit, minmax(200px, 1fr))",
														gap: 16,
														padding: "0 12px",
													}}
												>
													{perms.map((permission) => (
														<CustomCheckbox
															key={permission.id}
															checked={selectedPermissions.includes(permission.id)}
															onChange={(checked) =>
																handlePermissionChange(permission.id, checked)
															}
															style={{
																padding: "12px 16px",
																backgroundColor: "white",
																border: "1px solid #f0f0f0",
																borderRadius: 6,
																boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
																transition: "all 0.2s ease",
															}}
														>
															<div>
																<div style={{ fontWeight: 500, color: "#333" }}>
																	{permission.description}
																</div>
															</div>
														</CustomCheckbox>
													))}
												</div>

												{groupIndex! ==
													Object.keys(groupedPermissions).length - 1 && (
														<Divider style={{ margin: "20px 0" }} />
													)}
											</div>
										);
									}
								)}

								{/* Box tổng quyền đã chọn */}
								{selectedPermissions.length > 0 && (
									<div
										style={{
											marginTop: 20,
											padding: 14,
											backgroundColor: "#f6ffed",
											border: "1px solid #b7eb8f",
											borderRadius: 6,
										}}
									>
										<div
											style={{
												fontWeight: 500,
												color: "#52c41a",
												marginBottom: 10,
											}}
										>
											Đã chọn {selectedPermissions.length} quyền
										</div>
										<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
											{selectedPermissions.map((id) => {
												const permission = permissions.find((p) => p.id === id);
												return permission ? (
													<Tag key={id} color="green" style={{ margin: 0 }}>
														{permission.name}
													</Tag>
												) : null;
											})}
										</div>
									</div>
								)}
							</div>
						</Form.Item>
					</div>
				</Form>
			</Modal>
		</div>
	);
}