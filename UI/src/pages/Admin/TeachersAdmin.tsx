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
	Select,
	Flex,
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { GraduationCap } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title } = Typography;

type User = {
	id: number;
	fullName: string;
	email: string;
	phoneNumber?: string;
	role: string;
};

type Teacher = {
	id: number;
	userId: number;
	teacherCode: string;
	department?: string;
	position?: string;
	specialization?: string;
	createdAt?: string;
	updatedAt?: string;
	user?: User;
};

export default function TeachersAdmin() {
	const [loading, setLoading] = useState(true);
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal thêm/sửa
	const [form] = Form.useForm<any>();
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Teacher | null>(null);

	useEffect(() => {
		fetchTeachers();
		fetchUsers();
	}, []);

	async function fetchTeachers() {
		try {
			setLoading(true);
			const res = await instance.get<{ success: boolean; data: Teacher[] }>(
				`/teachers`
			);
			if (res.data.success) {
				setTeachers(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách giảng viên");
		} finally {
			setLoading(false);
		}
	}

	async function fetchUsers() {
		try {
			const res = await instance.get<{ success: boolean; data: User[] }>(
				`/users?role=teacher`
			);
			if (res.data.success) {
				setUsers(res.data.data || []);
			}
		} catch (err) {
			console.error("Không tải được danh sách users");
		}
	}

	const handleDelete = async (id: number) => {
		try {
			await instance.delete(`/teachers/${id}`);
			toast.success("Đã xóa giảng viên");
			setTeachers((prev) => prev.filter((t) => t.id !== id));
		} catch (err) {
			toast.error("Không thể xóa giảng viên");
		}
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			const payload = {
				teacherCode: values.teacherCode.trim(),
				password: values.password || "123456",
				fullName: values.fullName.trim(),
				email: values.email.trim(),
				department: values.department?.trim() || undefined,
				position: values.position?.trim() || undefined,
				specialization: values.specialization?.trim() || undefined,
			};

			if (editing) {
				await instance.patch(`/teachers/${editing.id}`, payload);
				toast.success("Đã cập nhật giảng viên");
			} else {
				await instance.post(`/teachers`, payload);
				toast.success("Đã thêm giảng viên mới");
			}

			setModalOpen(false);
			setEditing(null);
			form.resetFields();
			fetchTeachers();
		} catch (err: any) {
			if (err?.errorFields) return;
			const errorMsg = err?.response?.data?.message || "Không thể lưu giảng viên";
			toast.error(errorMsg);
		}
	};

	const columns = [
		{
			title: "Mã GV",
			dataIndex: "teacherCode",
			key: "teacherCode",
			sorter: (a: Teacher, b: Teacher) =>
				a.teacherCode.localeCompare(b.teacherCode),
			render: (text: string) => <strong>{text}</strong>,
		},
		{
			title: "Họ tên",
			key: "fullName",
			sorter: (a: Teacher, b: Teacher) =>
				(a.user?.fullName || "").localeCompare(b.user?.fullName || ""),
			render: (_: any, record: Teacher) => record.user?.fullName || "—",
		},
		{
			title: "Email",
			key: "email",
			render: (_: any, record: Teacher) => record.user?.email || "—",
		},
		{
			title: "Khoa",
			dataIndex: "department",
			key: "department",
			sorter: (a: Teacher, b: Teacher) =>
				(a.department || "").localeCompare(b.department || ""),
			render: (text: string) => text || <Tag color="default">Chưa có</Tag>,
		},
		{
			title: "Chức vụ",
			dataIndex: "position",
			key: "position",
			sorter: (a: Teacher, b: Teacher) =>
				(a.position || "").localeCompare(b.position || ""),
			render: (text: string) => text || <Tag color="default">Chưa có</Tag>,
		},
		{
			title: "Chuyên môn",
			dataIndex: "specialization",
			key: "specialization",
			sorter: (a: Teacher, b: Teacher) =>
				(a.specialization || "").localeCompare(b.specialization || ""),
			render: (text: string) => text || <Tag color="default">Chưa có</Tag>,
		},
		{
			title: "Ngày tạo",
			dataIndex: "createdAt",
			key: "createdAt",
			sorter: (a: Teacher, b: Teacher) =>
				new Date(a.createdAt || 0).getTime() -
				new Date(b.createdAt || 0).getTime(),
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			fixed: "right" as const,
			render: (_: any, record: Teacher) => (
				<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
					<Tooltip title="Sửa">
						<Button
							icon={<EditOutlined />}
							size="small"
							onClick={() => {
								setEditing(record);
								form.setFieldsValue({
									teacherCode: record.teacherCode,
									fullName: record.user?.fullName,
									email: record.user?.email,
									department: record.department,
									position: record.position,
									specialization: record.specialization,
								});
								setModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa giảng viên"
							description="Bạn có chắc muốn xóa giảng viên này?"
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

	const filteredTeachers = teachers.filter((t) => {
		if (!keyword) return true;
		const kw = keyword.toLowerCase();
		return (
			t.teacherCode?.toLowerCase().includes(kw) ||
			t.user?.fullName?.toLowerCase().includes(kw) ||
			t.user?.email?.toLowerCase().includes(kw) ||
			t.department?.toLowerCase().includes(kw) ||
			t.position?.toLowerCase().includes(kw) ||
			t.specialization?.toLowerCase().includes(kw)
		);
	});

	// Lọc users chưa có profile teacher
	const availableUsers = users.filter(
		(u) =>
			!teachers.some((t) => t.userId === u.id) ||
			(editing && u.id === editing.userId)
	);

	return (
		<div className="sm:px-3 h-auto sm:h-auto">
			{/* 🎯 RESPONSIVE HEADER */}
			
			<Flex
				wrap="wrap"
				gap={12}
				className="flex-col sm:flex-row items-start sm:items-center w-full pt-3 pb-5"
			>
				{/* Title Left */}
				<Title level={3} style={{ margin: 0 }}>
					<Flex align="center" gap={8}>
						<GraduationCap />
						<span>Quản lý Giảng viên</span>
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
						placeholder="Tìm theo mã GV, tên, email..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						className="w-full sm:w-80"
					/>

					{/* Buttons */}
					<Flex gap={8} wrap="wrap">
						<Button icon={<ReloadOutlined />} onClick={fetchTeachers}>
							<span className="hidden sm:inline">Làm mới</span>
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
							<span className="hidden sm:inline">Thêm giảng viên</span>
							<span className="inline sm:hidden">Thêm</span>
						</Button>
					</Flex>
				</Flex>
			</Flex>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách giảng viên..." />
				</div>
			) : (
				<div style={{ overflowX: "auto" }}>
					<Table<Teacher>
						dataSource={filteredTeachers}
						columns={columns}
						rowKey="id"
						bordered
						pagination={{
							pageSize: 10,
							showSizeChanger: true,
							showTotal: (total) => `Tổng ${total} giảng viên`,
							pageSizeOptions: ["10", "20", "50"],
							position: ["bottomRight"],
							style: { marginTop: 16 },
						}}
						locale={{ emptyText: "Không có giảng viên nào" }}
						scroll={{ x: 1200 }}
					/>
				</div>
			)}

			{/* Modal thêm/sửa */}
			<Modal
				title={editing ? "Sửa thông tin giảng viên" : "Thêm giảng viên mới"}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
				}}
				onOk={handleSubmit}
				okText={editing ? "Lưu" : "Tạo mới"}
				cancelText="Hủy"
				width={600}
				centered
				bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						label="Mã giảng viên"
						name="teacherCode"
						rules={[{ required: true, message: "Vui lòng nhập mã giảng viên" }]}
					>
						<Input placeholder="VD: GV001" maxLength={20} disabled={!!editing} />
					</Form.Item>

					<Form.Item
						label="Họ và tên"
						name="fullName"
						rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
					>
						<Input placeholder="VD: Nguyễn Văn A" maxLength={100} />
					</Form.Item>

					<Form.Item
						label="Email"
						name="email"
						rules={[
							{ required: true, message: "Vui lòng nhập email" },
							{ type: "email", message: "Email không hợp lệ" },
						]}
					>
						<Input placeholder="VD: gv001@example.com" maxLength={100} />
					</Form.Item>

					{!editing && (
						<Form.Item
							label="Mật khẩu"
							name="password"
							rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
							initialValue="123456"
						>
							<Input.Password placeholder="Mật khẩu mặc định: 123456" maxLength={50} />
						</Form.Item>
					)}

					<Form.Item label="Khoa" name="department">
						<Input placeholder="VD: Khoa Công nghệ thông tin" maxLength={100} />
					</Form.Item>

					<Form.Item label="Chức vụ" name="position">
						<Select
							placeholder="Chọn chức vụ"
							allowClear
							options={[
								{ value: "Giảng viên", label: "Giảng viên" },
								{ value: "Giảng viên chính", label: "Giảng viên chính" },
								{ value: "Giảng viên cao cấp", label: "Giảng viên cao cấp" },
								{ value: "Trưởng bộ môn", label: "Trưởng bộ môn" },
								{ value: "Phó trưởng khoa", label: "Phó trưởng khoa" },
								{ value: "Trưởng khoa", label: "Trưởng khoa" },
								{ value: "Phó Hiệu trưởng", label: "Phó Hiệu trưởng" },
								{ value: "Hiệu trưởng", label: "Hiệu trưởng" },
							]}
						/>
					</Form.Item>

					<Form.Item label="Chuyên môn" name="specialization">
						<Input placeholder="VD: Trí tuệ nhân tạo, Machine Learning" maxLength={200} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}