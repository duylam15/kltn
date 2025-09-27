import React, { useEffect, useState, useRef } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	message,
	Tag,
	Modal,
	Form,
	Input,
	Select,
	Popconfirm,
	Tooltip,
	Space,
} from "antd";
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	ReloadOutlined,
	SearchOutlined,
	UserOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import type { InputRef } from "antd";
import toast from "react-hot-toast";

const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";

type User = {
	id: number;
	fullName: string;
	email: string;
	phone?: string;
	avatar?: string;
};

type Student = {
	id: number;
	studentCode: string;
	className: string;
	user: User;
	createdAt: string;
	updatedAt?: string;
};

type Group = {
	id: number;
	groupCode?: string;
	groupName?: string;
	maxMembers?: number;
	isActive?: boolean;
	enrollments?: Enrollment[];
};

type Enrollment = {
	id: number;
	sectionId: number;
	studentId: number;
	groupId?: number;
	enrolledAt: string;
	student: Student;
	group?: Group;
};

export default function StudentList() {
	const path = window.location.pathname;
	const sectionId = Number(path.split("/")[3]);

	const [loading, setLoading] = useState(true);
	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [groups, setGroups] = useState<Group[]>([]);
	const [keyword, setKeyword] = useState("");

	// Modal states
	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [groupModalOpen, setGroupModalOpen] = useState(false);
	const [editing, setEditing] = useState<Enrollment | null>(null);
	const [assigningStudent, setAssigningStudent] = useState<Enrollment | null>(null);

	const [form] = Form.useForm();
	const [addForm] = Form.useForm();
	const [groupForm] = Form.useForm();

	// trong component
	const studentCodeRef = useRef<InputRef>(null);
	const emailRef = useRef<InputRef>(null);


	useEffect(() => {
		fetchData();
	}, [sectionId]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [enrollmentsRes, groupsRes] = await Promise.all([
				axios.get<{ success: boolean; data: Enrollment[] }>(
					`${API_BASE}/sections-enrollments/section/${sectionId}/students`
				),
				axios.get<{ success: boolean; data: Group[] }>(
					`${API_BASE}/sections-enrollments/section/${sectionId}/groups`
				),
			]);

			if (enrollmentsRes.data.success) {
				setEnrollments(enrollmentsRes.data.data || []);
			}

			if (groupsRes.data.success) {
				const groupsData = groupsRes.data.data || [];
				setGroups(groupsData);

				// Tạo map để tìm group cho mỗi student
				const groupMap: Record<number, Group> = {};
				groupsData.forEach(group => {
					group.enrollments?.forEach(enrollment => {
						groupMap[enrollment.studentId] = group;
					});
				});

				// Cập nhật enrollments với thông tin group
				setEnrollments(prev =>
					prev.map(enrollment => ({
						...enrollment,
						group: groupMap[enrollment.studentId] || undefined,
						groupId: groupMap[enrollment.studentId]?.id || undefined
					}))
				);
			}
		} catch (err) {
			console.error("Lỗi khi tải dữ liệu:", err);
			toast.error("Không tải được danh sách sinh viên");
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = async () => {
		try {
			const values = await addForm.validateFields();

			const studentPayload = {
				studentCode: values.studentCode?.trim(),
				password: "123456",
				fullName: values.fullName?.trim(),
				email: values.email?.trim(),
				className: values.className?.trim(),
				major: values.major?.trim() || "Information Technology",
			};

			const studentRes = await axios.post(`${API_BASE}/students`, studentPayload);

			if (!studentRes.data.success) {
				const msg = studentRes.data.message || "Không thể tạo sinh viên";
				// map lỗi backend → field
				if (/student code/i.test(msg)) {
					addForm.setFields([{ name: "studentCode", errors: [msg] }]);
					addForm.scrollToField("studentCode");
					setTimeout(() => studentCodeRef.current?.focus({ cursor: "end" }), 0);
				} else if (/email/i.test(msg)) {
					addForm.setFields([{ name: "email", errors: [msg] }]);
					addForm.scrollToField("email");
					setTimeout(() => emailRef.current?.focus({ cursor: "end" }), 0);
				} else {
					toast.error(msg);
				}
				return;
			}

			const createdStudent = studentRes.data.data;

			// Enroll
			const enrollmentPayload = {
				sectionId,
				studentId: createdStudent.student.id,
			};
			const enrollmentRes = await axios.post(
				`${API_BASE}/sections-enrollments`,
				enrollmentPayload
			);

			if (enrollmentRes.data.success) {
				toast.success("Thêm sinh viên vào lớp thành công");
				setAddModalOpen(false);
				addForm.resetFields();
				fetchData();
			} else {
				toast.error(enrollmentRes.data.message || "Sinh viên đã tạo nhưng không thể gán vào lớp");
				fetchData();
			}
		} catch (err: any) {
			if (err?.errorFields) return; // lỗi validate client

			const status = err.response?.status;
			const msg: string = err.response?.data?.message || "Không thể thêm sinh viên";

			// —— Map lỗi 409 từ backend → field + focus ——
			if (status === 409) {
				if (/student code/i.test(msg)) {
					addForm.setFields([{ name: "studentCode", errors: ["MSSV đã tồn tại"] }]);
					addForm.scrollToField("studentCode");
					setTimeout(() => studentCodeRef.current?.focus({ cursor: "end" }), 0);
					return;
				}
			}

			// Lỗi format MSSV do backend validate
			if (/invalid.*student.*code/i.test(msg)) {
				addForm.setFields([{ name: "studentCode", errors: [msg] }]);
				addForm.scrollToField("studentCode");
				setTimeout(() => studentCodeRef.current?.focus({ cursor: "end" }), 0);
				return;
			}

			toast.error(msg);
		}
	};

	useEffect(() => {
		if (editing) {
			form.setFieldsValue({
				fullName: editing.student.user.fullName,
				email: editing.student.user.email,
				phoneNumber: editing.student.user.phone,
				className: editing.student.className,
			});
		} else {
			form.resetFields();
		}
	}, [editing, form]);

	const handleUpdate = async () => {
		try {
			const values = await form.validateFields();
			if (!editing) return;

			// payload cho User
			const userPayload = {
				email: values.email?.trim(),
				fullName: values.fullName?.trim(),
				phone: values.phoneNumber?.trim() || null,
			};
			console.log(editing);

			// gọi API update User
			const res = await axios.patch(
				`${API_BASE}/users/${editing.student.user.id}`, // chú ý lấy user.id
				userPayload
			);
			if (res.data.success) {
				toast.success("Cập nhật thông tin người dùng thành công");
				setEditModalOpen(false);
				setEditing(null);
				fetchData();	
			} else {
				toast.error(res.data.message || "Không thể cập nhật thông tin người dùng");
			}
		} catch (err: any) {
			if (err?.errorFields) return; // lỗi validate form
			console.error("Lỗi update:", err);
			toast.error(err.response?.data?.message || "Không thể cập nhật thông tin người dùng");
		}
	};

	const handleDelete = async (id: number) => {
		try {
			const res = await axios.delete(`${API_BASE}/sections-enrollments/${id}`);
			if (res.data.success) {
				toast.success("Xóa sinh viên thành công");
				setEnrollments((prev) => prev.filter((e) => e.id !== id));
			} else {
				toast.error(res.data.message || "Không thể xóa sinh viên");
			}
		} catch (err: any) {
			console.error("Lỗi delete:", err);
			toast.error(err.response?.data?.message || "Không thể xóa sinh viên");
		}
	};

	const handleAssignToGroup = async () => {
		try {
			const values = await groupForm.validateFields();
			if (!assigningStudent) return;

			const res = await axios.patch(
				`${API_BASE}/sections-enrollments/${assigningStudent.id}/assign-group`,
				{
					groupId: values.groupId || null,
				}
			);

			if (res.data.success) {
				toast.success("Phân nhóm thành công");
				setGroupModalOpen(false);
				setAssigningStudent(null);
				groupForm.resetFields();
				fetchData();
			} else {
				toast.error(res.data.message || "Không thể phân nhóm");
			}
		} catch (err: any) {
			if (err?.errorFields) return; // lỗi validate form
			console.error("Lỗi assign group:", err);
			toast.error(err.response?.data?.message || "Không thể phân nhóm");
		}
	};

	const getGroupTag = (group: Group | undefined) => {
		if (!group) return <Tag color="default">Chưa có nhóm</Tag>;
		return (
			<Tag color="blue">
				{group.groupName || group.groupCode || `Nhóm #${group.id}`}
			</Tag>
		);
	};

	const columns = [
		{
			title: "MSSV",
			dataIndex: ["student", "studentCode"],
			key: "studentCode",
			width: 100,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student.studentCode || "").localeCompare(b.student.studentCode || ""),
			render: (text: string) => (
				<div style={{ fontWeight: 600, color: "#1890ff", whiteSpace: "nowrap" }}>
					<UserOutlined style={{ marginRight: 8 }} />
					<Tooltip title={text} placement="topLeft">
						{text}
					</Tooltip>
				</div>
			),
		},
		{
			title: "Họ và tên",
			dataIndex: ["student", "user", "fullName"],
			key: "fullName",
			width: 160,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student.user.fullName || "").localeCompare(
					b.student.user.fullName || ""
				),
			render: (text: string) => (
				<Tooltip title={text} placement="topLeft">
					{text}
				</Tooltip>
			),
		},
		{
			title: "Email",
			dataIndex: ["student", "user", "email"],
			key: "email",
			width: 180,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student.user.email || "").localeCompare(b.student.user.email || ""),
			render: (text: string) => (
				<Tooltip title={text} placement="topLeft">
					{text}
				</Tooltip>
			),
		},
		{
			title: "Số điện thoại",
			dataIndex: ["student", "user", "phone"],
			key: "phone",
			width: 120,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student.user.phone || "").localeCompare(b.student.user.phone || ""),
			render: (text: string) =>
				text ? (
					<Tooltip title={text}>{text}</Tooltip>
				) : (
					<Tag color="default">Chưa có</Tag>
				),
		},
		{
			title: "Lớp",
			dataIndex: ["student", "className"],
			key: "className",
			width: 100,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student.className || "").localeCompare(b.student.className || ""),
			render: (text: string) => (
				<Tooltip title={text}>
					<Tag color="green">{text}</Tag>
				</Tooltip>
			),
		},
		{
			title: "Nhóm",
			key: "group",
			align: "center" as const,
			width: 100,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) => {
				const nameA =
					a.group?.groupName ||
					a.group?.groupCode ||
					(a.group ? `Nhóm #${a.group.id}` : "");
				const nameB =
					b.group?.groupName ||
					b.group?.groupCode ||
					(b.group ? `Nhóm #${b.group.id}` : "");
				return (nameA || "").localeCompare(nameB || "");
			},
			render: (_: any, record: Enrollment) => getGroupTag(record.group),
		},
		{
			title: "Ngày đăng ký",
			dataIndex: "enrolledAt",
			key: "enrolledAt",
			width: 150,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime(),
			render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 120,
			render: (_: any, record: Enrollment) => (
				<div style={{ display: "flex", gap: 8 }}>
					<Tooltip title="Phân nhóm">
						<Button
							size="small"
							icon={<TeamOutlined />}
							onClick={() => {
								setAssigningStudent(record);
								groupForm.setFieldsValue({
									groupId: record.groupId || undefined,
								});
								setGroupModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Sửa">
						<Button
							size="small"
							icon={<EditOutlined />}
							onClick={() => {
								setEditing(record);
								form.setFieldsValue({
									fullName: record.student.user.fullName,
									email: record.student.user.email,
									phoneNumber: record.student.user.phone,
									className: record.student.className,
								});
								setEditModalOpen(true);
							}}
						/>
					</Tooltip>
					<Tooltip title="Xóa">
						<Popconfirm
							title="Xóa sinh viên"
							description="Bạn có chắc muốn xóa sinh viên này khỏi lớp?"
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



	const filteredEnrollments = enrollments.filter((enrollment) => {
		if (!keyword) return true;
		const searchText = keyword.toLowerCase();

		return (
			(enrollment.student.studentCode ?? "")
				.toLowerCase()
				.includes(searchText) ||
			(enrollment.student.user.fullName ?? "")
				.toLowerCase()
				.includes(searchText) ||
			(enrollment.student.user.email ?? "")
				.toLowerCase()
				.includes(searchText) ||
			(enrollment.student.className ?? "")
				.toLowerCase()
				.includes(searchText) ||
			(enrollment.group?.groupName ?? "")
				.toLowerCase()
				.includes(searchText) ||
			(enrollment.group?.groupCode ?? "")
				.toLowerCase()
				.includes(searchText)
		);
	});

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
				<div style={{ display: "flex", justifyItems: "flex-end", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo MSSV, tên, email, lớp, nhóm..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 320 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchData}>
						Refresh
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							setEditing(null);
							addForm.resetFields();
							setAddModalOpen(true);
						}}
					>
						Thêm sinh viên
					</Button>
				</div>
			</div>

			<Table<Enrollment>
				dataSource={filteredEnrollments}
				columns={columns}
				rowKey="id"
				bordered
				pagination={{ pageSize: 10 }}
				tableLayout="fixed"   // đủ để ellipsis hoạt động
			/>


			{/* Modal thêm sinh viên */}
			<Modal
				title="Thêm sinh viên mới"
				open={addModalOpen}
				onCancel={() => {
					setAddModalOpen(false);
					addForm.resetFields();
				}}
				onOk={handleAdd}
				okText="Thêm mới"
				width={600}
			>
				<Form form={addForm} layout="vertical" validateTrigger="onBlur">
					<Form.Item
						name="studentCode"
						label="Mã số sinh viên"
						rules={[
							{ required: true, message: "Vui lòng nhập MSSV" },
							{ pattern: /^[0-9]{6,12}$/, message: "MSSV chỉ gồm số (6–12 ký tự)" },
						]}
					>
						<Input ref={studentCodeRef} placeholder="VD: 2021001234" />
					</Form.Item>

					<Form.Item
						name="fullName"
						label="Họ và tên"
						rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
					>
						<Input placeholder="VD: Nguyễn Văn A" />
					</Form.Item>

					<Form.Item
						name="major"
						label="Chuyên ngành"
						rules={[{ required: true, message: "Vui lòng nhập chuyên ngành" }]}
					>
						<Input placeholder="VD: Information Technology, Software Engineering" />
					</Form.Item>
				</Form>

			</Modal>

			{/* Modal sửa sinh viên */}
			<Modal
				title="Chỉnh sửa thông tin sinh viên"
				open={editModalOpen}
				onCancel={() => {
					setEditModalOpen(false);
					setEditing(null);
				}}
				onOk={handleUpdate}
				okText="Cập nhật"
				width={600}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						name="fullName"
						label="Họ và tên"
						rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
					>
						<Input placeholder="VD: Nguyễn Văn A" />
					</Form.Item>
					<Form.Item
						name="email"
						label="Email"
						rules={[
							{ required: true, message: "Vui lòng nhập email" },
							{ type: "email", message: "Email không hợp lệ" },
						]}
					>
						<Input placeholder="VD: student@university.edu.vn" />
					</Form.Item>
					<Form.Item name="phoneNumber" label="Số điện thoại">
						<Input placeholder="VD: 0123456789" />
					</Form.Item>
					<Form.Item
						name="className"
						label="Lớp"
						rules={[{ required: true, message: "Vui lòng nhập lớp" }]}
					>
						<Input placeholder="VD: CNTT2021A" />
					</Form.Item>
					{editing && (
						<div
							style={{
								padding: 12,
								backgroundColor: "#f5f5f5",
								borderRadius: 6,
								marginBottom: 16,
							}}
						>
							<strong>MSSV:</strong> {editing.student.studentCode} (không thể sửa)
						</div>
					)}
				</Form>
			</Modal>

			{/* Modal phân nhóm */}
			<Modal
				title={`Phân nhóm cho sinh viên: ${assigningStudent?.student.user.fullName}`}
				open={groupModalOpen}
				onCancel={() => {
					setGroupModalOpen(false);
					setAssigningStudent(null);
					groupForm.resetFields();
				}}
				onOk={handleAssignToGroup}
				okText="Phân nhóm"
			>
				<Form form={groupForm} layout="vertical">
					<div
						style={{
							padding: 12,
							backgroundColor: "#e6f7ff",
							borderRadius: 6,
							marginBottom: 16,
							border: "1px solid #91d5ff",
						}}
					>
						<Space direction="vertical" size={4}>
							<div><strong>MSSV:</strong> {assigningStudent?.student.studentCode}</div>
							<div><strong>Họ tên:</strong> {assigningStudent?.student.user.fullName}</div>
							<div><strong>Lớp:</strong> {assigningStudent?.student.className}</div>
							<div><strong>Nhóm hiện tại:</strong> {getGroupTag(assigningStudent?.group)}</div>
						</Space>
					</div>
					<Form.Item name="groupId" label="Chọn nhóm">
						<Select
							placeholder="Chọn nhóm (để trống nếu muốn bỏ nhóm)"
							allowClear
							showSearch
							filterOption={(input, option) =>
								(option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
							}
						>
							{groups
								.filter((g) => g.isActive !== false)
								.map((group) => {
									const currentMembers = group.enrollments?.length || 0;
									const maxMembers = group.maxMembers || 0;
									const isFull = currentMembers >= maxMembers;

									return (
										<Option
											key={group.id}
											value={group.id}
											disabled={isFull}
										>
											{group.groupName || group.groupCode || `Nhóm #${group.id}`}
											{` (${currentMembers}/${maxMembers})`}
											{isFull && " - Đã đầy"}
										</Option>
									);
								})}
						</Select>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}