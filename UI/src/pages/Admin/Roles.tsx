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
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	KeyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { toast } from 'react-hot-toast';
import { useAuth } from "../../context/authContext";
import { User } from "lucide-react";

const { Title } = Typography;
const { TextArea } = Input;
const API_BASE = "http://localhost:4000/api/v1";

type Permission = {
	id: number;
	name: string;
	description: string;
	groupName: string;
	createdAt: string;
};

// Cập nhật type Role để reflect đúng cấu trúc API
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

export default function Roles() {
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
	const { hasPermission } = useAuth(); // ✅ thêm dòng này

	useEffect(() => {
		fetchRoles();
		fetchPermissions();
	}, []);

	async function fetchRoles() {
		try {
			setLoading(true);
			const res = await axios.get<{ success: boolean; data: Role[] }>(
				`${API_BASE}/roles`
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
			const res = await axios.get<{ success: boolean; data: Permission[] }>(
				`${API_BASE}/permissions`
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
			await axios.delete(`${API_BASE}/roles/${id}`);
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
				const res = await axios.put(`${API_BASE}/roles/${editing.id}`, payload);
				toast.success('Successfully created!');

				console.log(res);
			} else {
				await axios.post(`${API_BASE}/roles`, payload);
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
			// Add all group permissions
			setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
		} else {
			// Remove all group permissions
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
			sorter: (a: Role, b: Role) => a.name.localeCompare(b.name),
			render: (text: string) => <strong>{text}</strong>,
		},
		{
			title: "Mô tả",
			dataIndex: "description",
			key: "description",
			sorter: (a: Role, b: Role) => (a.description || "").localeCompare(b.description || ""),
			render: (text: string) => text || <Tag color="default">Chưa có mô tả</Tag>,
		},
		{
			title: "Số quyền",
			key: "permissionsCount",
			align: "center" as const,
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
			sorter: (a: Role, b: Role) =>
				new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			render: (_: any, record: Role) => (
				<div style={{ display: "flex", gap: 8 }}>
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
						<Tooltip title="Sửa">
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
						</Tooltip>
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
				</div>
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
		<div className="pl-3 pr-3">
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
			}}>
				<Title level={3} className="mt-2">
					<div className="flex items-center gap-2">
						<div className=""><User /></div> Quản lý Vai trò
					</div>
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo tên vai trò/mô tả..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 280 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchRoles}>
						Refresh
					</Button>
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
							Thêm vai trò
						</Button>

				</div>
			</div>

			{loading ? (
				<Spin tip="Đang tải..." />
			) : (
				<Table<Role>
					dataSource={filteredRoles}
					columns={columns}
					rowKey="id"
					bordered
					pagination={{ pageSize: 10 }}
				/>
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

			<Modal
				title={editing ? "Sửa vai trò" : "Thêm vai trò"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setSelectedPermissions([]);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tạo mới"}
				width="80%"     // chiếm 100% màn hình
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

												{groupIndex !==
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