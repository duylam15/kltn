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
	Popconfirm,
	Tabs,
	Select,
	Checkbox,
	Space,
	Card,
	Badge,
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	DeleteOutlined,
	UserOutlined,
	BookOutlined,
	InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { GraduationCap, UserCog } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title } = Typography;

type User = {
	id: number;
	email: string;
	fullName: string;
	phone?: string;
	avatarUrl?: string;
};

type Teacher = {
	id: number;
	userId: number;
	teacherCode: string;
	department: string;
	position: string;
	specialization: string;
	user?: User;
};

type Subject = {
	id: number;
	subjectCode: string;
	subjectName: string;
	credits: number;
};

type SubjectInstructor = {
	id: number;
	subjectId: number;
	teacherId: number;
	role: string;
	assignedAt: string;
	isActive: boolean;
	subject?: Subject;
	teacher?: Teacher;
};

export default function InstructorsAdmin() {
	const [loading, setLoading] = useState(true);
	const [instructors, setInstructors] = useState<SubjectInstructor[]>([]);
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [subjects, setSubjects] = useState<Subject[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal thêm phân công
	const [modalOpen, setModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"byTeacher" | "bySubject">("byTeacher");

	// Thêm theo giảng viên
	const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
	const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

	// Thêm theo môn học
	const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
	const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);

	// Tìm kiếm trong modal
	const [searchSubject, setSearchSubject] = useState("");
	const [searchTeacher, setSearchTeacher] = useState("");

	useEffect(() => {
		fetchInstructors();
		fetchTeachers();
		fetchSubjects();
	}, []);

	// Cập nhật selectedSubjects khi chọn giảng viên
	useEffect(() => {
		if (selectedTeacher) {
			const assignedSubjects = instructors
				.filter((i) => i.teacherId === selectedTeacher && i.isActive)
				.map((i) => i.subjectId);
			setSelectedSubjects(assignedSubjects);
		} else {
			setSelectedSubjects([]);
		}
	}, [selectedTeacher, instructors]);

	// Cập nhật selectedTeachers khi chọn môn học
	useEffect(() => {
		if (selectedSubject) {
			const assignedTeachers = instructors
				.filter((i) => i.subjectId === selectedSubject && i.isActive)
				.map((i) => i.teacherId);
			setSelectedTeachers(assignedTeachers);
		} else {
			setSelectedTeachers([]);
		}
	}, [selectedSubject, instructors]);

	async function fetchInstructors() {
		try {
			setLoading(true);
			const res = await instance.get<{ success: boolean; data:   SubjectInstructor[] }>(
				`/subject-instructors`
			);
			console.log(res.data);
			if (res.data.success) {
				setInstructors(res.data.data || []);
			}
		} catch (err) {
			toast.error("Không tải được danh sách phân công");
		} finally {
			setLoading(false);
		}
	}

	async function fetchTeachers() {
		try {
			const res = await instance.get<{ success: boolean; data: Teacher[] }>(
				`/teachers`
			);
			if (res.data.success) {
				setTeachers(res.data.data || []);
			}
		} catch (err) {
			console.error("Không tải được danh sách giảng viên");
		}
	}

	async function fetchSubjects() {
		try {
			const res = await instance.get<{ success: boolean; data: Subject[] }>(
				`/subjects`
			);
			if (res.data.success) {
				setSubjects(res.data.data || []);
			}
		} catch (err) {
			console.error("Không tải được danh sách môn học");
		}
	}

	const handleDelete = async (subjectId: number, teacherId: number) => {
		try {
			await instance.delete(
				`/subject-instructors/${subjectId}/${teacherId}`
			);
			toast.success("Đã xóa phân công");
			setInstructors((prev) =>
				prev.filter(
					(i) => !(i.subjectId === subjectId && i.teacherId === teacherId)
				)
			);
		} catch (err: any) {
			const errorMsg = err?.response?.data?.message || "Không thể xóa phân công";
			toast.error(errorMsg);
		}
	};

	const handleAssign = async () => {
		try {
			if (activeTab === "byTeacher") {
				// Phân công nhiều môn cho 1 giảng viên
				if (!selectedTeacher) {
					toast.error("Vui lòng chọn giảng viên");
					return;
				}

				if (selectedSubjects.length === 0) {
					toast.error("Vui lòng chọn ít nhất một môn học");
					return;
				}

				// Lấy danh sách phân công hiện tại của giảng viên
				const currentAssignments = instructors
					.filter((i) => i.teacherId === selectedTeacher && i.isActive)
					.map((i) => i.subjectId);

				// Tìm các môn cần thêm
				const toAdd = selectedSubjects.filter(
					(sid) => !currentAssignments.includes(sid)
				);

				// Tìm các môn cần xóa
				const toRemove = currentAssignments.filter(
					(sid) => !selectedSubjects.includes(sid)
				);

				// Thêm phân công mới (bulk)
				if (toAdd.length > 0) {
					await instance.post(`/subject-instructors/bulk-assign-subjects`, {
						teacherId: selectedTeacher,
						subjectIds: toAdd,
						role: "owner",
					});
				}

				// Xóa phân công cũ (bulk)
				if (toRemove.length > 0) {
					await instance.delete(`/subject-instructors/bulk-remove-teachers`, {
						data: {
							subjectId: toRemove[0], // Xóa từng môn
							teacherIds: [selectedTeacher],
						},
					});

					// Nếu có nhiều môn cần xóa, xóa lần lượt
					for (let i = 1; i < toRemove.length; i++) {
						await instance.delete(`/subject-instructors/bulk-remove-teachers`, {
							data: {
								subjectId: toRemove[i],
								teacherIds: [selectedTeacher],
							},
						});
					}
				}

				if (toAdd.length > 0 || toRemove.length > 0) {
					toast.success(
						`Đã cập nhật phân công (thêm: ${toAdd.length}, xóa: ${toRemove.length})`
					);
				} else {
					toast.success("Không có thay đổi nào");
				}
			} else {
				// Phân công 1 môn cho nhiều giảng viên
				if (!selectedSubject) {
					toast.error("Vui lòng chọn môn học");
					return;
				}

				if (selectedTeachers.length === 0) {
					toast.error("Vui lòng chọn ít nhất một giảng viên");
					return;
				}

				// Lấy danh sách giảng viên hiện tại của môn học
				const currentAssignments = instructors
					.filter((i) => i.subjectId === selectedSubject && i.isActive)
					.map((i) => i.teacherId);

				// Tìm các giảng viên cần thêm
				const toAdd = selectedTeachers.filter(
					(tid) => !currentAssignments.includes(tid)
				);

				// Tìm các giảng viên cần xóa
				const toRemove = currentAssignments.filter(
					(tid) => !selectedTeachers.includes(tid)
				);

				// Thêm phân công mới (bulk)
				if (toAdd.length > 0) {
					await instance.post(
						`/subject-instructors/bulk-assign-teachers`,
						{
							subjectId: selectedSubject,
							teacherIds: toAdd,
							role: "co",
						}
					);
				}

				// Xóa phân công cũ (bulk)
				if (toRemove.length > 0) {
					await instance.delete(
						`/subject-instructors/bulk-remove-teachers`,
						{
							data: {
								subjectId: selectedSubject,
								teacherIds: toRemove,
							},
						}
					);
				}

				if (toAdd.length > 0 || toRemove.length > 0) {
					toast.success(
						`Đã cập nhật phân công (thêm: ${toAdd.length}, xóa: ${toRemove.length})`
					);
				} else {
					toast.success("Không có thay đổi nào");
				}
			}

			setModalOpen(false);
			resetModal();
			fetchInstructors();
		} catch (err: any) {
			const errorMsg =
				err?.response?.data?.message || "Không thể cập nhật phân công";
			toast.error(errorMsg);
		}
	};

	const resetModal = () => {
		setSelectedTeacher(null);
		setSelectedSubjects([]);
		setSelectedSubject(null);
		setSelectedTeachers([]);
		setActiveTab("byTeacher");
		setSearchSubject("");
		setSearchTeacher("");
	};

	const columns = [
		{
			title: "Môn học",
			key: "subject",
			render: (_: any, record: SubjectInstructor) => (
				<div>
					<div>
						<strong>{record.subject?.subjectCode}</strong> -{" "}
						{record.subject?.subjectName}
					</div>
					<div style={{ fontSize: 12, color: "#666" }}>
						<GraduationCap size={12} style={{ display: "inline", marginRight: 4 }} />
						{record.subject?.credits} tín chỉ
					</div>
				</div>
			),
		},
		{
			title: "Giảng viên",
			key: "teacher",
			render: (_: any, record: SubjectInstructor) => (
				<div>
					<div>
						<strong>{record.teacher?.user?.fullName}</strong>
					</div>
					<div style={{ fontSize: 12, color: "#666" }}>
						{record.teacher?.teacherCode} - {record.teacher?.user?.email}
					</div>
					{record.teacher?.user?.phone && (
						<div style={{ fontSize: 12, color: "#666" }}>
							📞 {record.teacher?.user?.phone}
						</div>
					)}
				</div>
			),
		},
		{
			title: "Khoa/Bộ môn",
			dataIndex: ["teacher", "department"],
			key: "department",
		},
		{
			title: "Chức vụ",
			dataIndex: ["teacher", "position"],
			key: "position",
			render: (text: string) => <Tag color="blue">{text}</Tag>,
		},
		{
			title: "Chuyên môn",
			dataIndex: ["teacher", "specialization"],
			key: "specialization",
			render: (text: string) => (
				<Tooltip title={text}>
					<span style={{ fontSize: 12 }}>{text}</span>
				</Tooltip>
			),
		},
		{
			title: "Vai trò",
			dataIndex: "role",
			key: "role",
			render: (role: string) => {
				const roleConfig: any = {
					owner: { color: "green", text: "Chủ nhiệm" },
					co: { color: "blue", text: "Đồng giảng" },
					ta: { color: "orange", text: "Trợ giảng" },
				};
				const config = roleConfig[role] || { color: "default", text: role };
				return <Tag color={config.color}>{config.text}</Tag>;
			},
		},
		{
			title: "Trạng thái",
			dataIndex: "isActive",
			key: "isActive",
			render: (isActive: boolean) => (
				<Badge
					status={isActive ? "success" : "default"}
					text={isActive ? "Đang hoạt động" : "Không hoạt động"}
				/>
			),
		},
		{
			title: "Ngày phân công",
			dataIndex: "assignedAt",
			key: "assignedAt",
			render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
		},
		{
			title: "Hành động",
			key: "actions",
			align: "center" as const,
			render: (_: any, record: SubjectInstructor) => (
				<Tooltip title="Xóa phân công">
					<Popconfirm
						title="Xóa phân công"
						description={
							<div>
								<p>Bạn có chắc muốn xóa phân công này?</p>
								<p style={{ color: "#ff4d4f", fontSize: 12 }}>
									<InfoCircleOutlined /> Lưu ý: Giảng viên đang dạy lớp học của môn này sẽ không thể xóa
								</p>
							</div>
						}
						okText="Xóa"
						cancelText="Hủy"
						okButtonProps={{ danger: true }}
						onConfirm={() =>
							handleDelete(record.subjectId, record.teacherId)
						}
					>
						<Button danger size="small" icon={<DeleteOutlined />} />
					</Popconfirm>
				</Tooltip>
			),
		},
	];

	const filteredInstructors = instructors.filter((i) => {
		if (!keyword) return true;
		const kw = keyword.toLowerCase();
		return (
			i.subject?.subjectCode?.toLowerCase().includes(kw) ||
			i.subject?.subjectName?.toLowerCase().includes(kw) ||
			i.teacher?.user?.fullName?.toLowerCase().includes(kw) ||
			i.teacher?.teacherCode?.toLowerCase().includes(kw) ||
			i.teacher?.department?.toLowerCase().includes(kw) ||
			i.teacher?.specialization?.toLowerCase().includes(kw)
		);
	});

	return (
		<div className="pl-3 pr-3">
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<Title level={3} className="mt-2">
					<div className="flex items-center gap-2">
						<UserCog /> Quản lý phân công giảng viên
					</div>
				</Title>
				<div style={{ display: "flex", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo môn học, giảng viên, mã môn..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 400 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={fetchInstructors}>
						Làm mới
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							resetModal();
							setModalOpen(true);
						}}
					>
						Phân công
					</Button>
				</div>
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách phân công..." />
				</div>
			) : (
				<Table<SubjectInstructor>
					dataSource={filteredInstructors}
					columns={columns}
					rowKey={(record) => `${record.subjectId}-${record.teacherId}`}
					bordered
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Tổng ${total} phân công`,
					}}
					locale={{ emptyText: "Không có phân công nào" }}
				/>
			)}

			{/* Modal thêm phân công */}
			<Modal
				title="Phân công giảng viên giảng dạy môn học"
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					resetModal();
				}}
				onOk={handleAssign}
				okText="Lưu phân công"
				cancelText="Hủy"
				width={700}
				centered
				bodyStyle={{
					maxHeight: "70vh",
					height: "70vh",
					overflowY: "auto",
				}}
			>
				<Tabs
					activeKey={activeTab}
					onChange={(key) =>
						setActiveTab(key as "byTeacher" | "bySubject")
					}
					style={{ marginTop: -10 }}
					items={[
						{
							key: "byTeacher",
							label: (
								<span>
									<UserOutlined /> Theo giảng viên
								</span>
							),
							children: (
								<div style={{ marginTop: -20 }}>
									<Space
										direction="vertical"
										style={{ width: "100%" }}
										size="small"
									>
										<Card size="small" title="1. Chọn giảng viên">
											<Select
												showSearch
												style={{ width: "100%" }}
												placeholder="Chọn giảng viên"
												value={selectedTeacher}
												onChange={setSelectedTeacher}
												filterOption={(input, option) =>
													(option?.label ?? "")
														.toLowerCase()
														.includes(input.toLowerCase())
												}
												options={teachers.map((t) => ({
													value: t.id,
													label: `${t.user?.fullName} (${t.teacherCode}) - ${t.department}`,
												}))}
											/>
										</Card>

										<Card
											size="small"
											title="2. Chọn các môn học cần phân công"
										>
											<Input
												allowClear
												prefix={<SearchOutlined />}
												placeholder="Tìm kiếm môn học..."
												value={searchSubject}
												onChange={(e) =>
													setSearchSubject(e.target.value)
												}
												style={{ marginBottom: 12 }}
											/>
											<Checkbox.Group
												style={{ width: "100%" }}
												value={selectedSubjects}
												onChange={setSelectedSubjects}
											>
												<div
													style={{
														display: "flex",
														flexDirection: "column",
														gap: 8,
														maxHeight: 300,
														overflowY: "auto",
													}}
													className="w-[100%]"
												>
													{subjects
														.filter((subject) => {
															if (!searchSubject) return true;
															const search =
																searchSubject.toLowerCase();
															return (
																subject.subjectCode
																	?.toLowerCase()
																	.includes(search) ||
																subject.subjectName
																	?.toLowerCase()
																	.includes(search)
															);
														})
														.map((subject) => (
															<Checkbox
																key={subject.id}
																value={subject.id}
																disabled={!selectedTeacher}
															>
																<div>
																	<strong>
																		{subject.subjectCode}
																	</strong>{" "}
																	- {subject.subjectName}
																	<div
																		style={{
																			fontSize: 12,
																			color: "#666",
																		}}
																	>
																		{subject.credits} tín chỉ
																	</div>
																</div>
															</Checkbox>
														))}
												</div>
											</Checkbox.Group>
										</Card>
									</Space>
								</div>
							),
						},
						{
							key: "bySubject",
							label: (
								<span>
									<BookOutlined /> Theo môn học
								</span>
							),
							children: (
								<div style={{ marginTop: -20 }}>
									<Space
										direction="vertical"
										style={{ width: "100%" }}
										size="small"
									>
										<Card size="small" title="1. Chọn môn học">
											<Select
												showSearch
												style={{ width: "100%" }}
												placeholder="Chọn môn học"
												value={selectedSubject}
												onChange={setSelectedSubject}
												filterOption={(input, option) =>
													(option?.label ?? "")
														.toLowerCase()
														.includes(input.toLowerCase())
												}
												options={subjects.map((s) => ({
													value: s.id,
													label: `${s.subjectCode} - ${s.subjectName} (${s.credits} TC)`,
												}))}
											/>
										</Card>

										<Card
											size="small"
											title="2. Chọn các giảng viên cần phân công"
										>
											<Input
												allowClear
												prefix={<SearchOutlined />}
												placeholder="Tìm kiếm giảng viên..."
												value={searchTeacher}
												onChange={(e) =>
													setSearchTeacher(e.target.value)
												}
												style={{ marginBottom: 12 }}
											/>
											<Checkbox.Group
												style={{ width: "100%" }}
												value={selectedTeachers}
												onChange={setSelectedTeachers}
											>
												<div
													style={{
														display: "flex",
														flexDirection: "column",
														gap: 8,
														maxHeight: 300,
														overflowY: "auto",
													}}
													className="w-[100%]"
												>
													{teachers
														.filter((teacher) => {
															if (!searchTeacher) return true;
															const search =
																searchTeacher.toLowerCase();
															return (
																teacher.user?.fullName
																	?.toLowerCase()
																	.includes(search) ||
																teacher.teacherCode
																	?.toLowerCase()
																	.includes(search) ||
																teacher.department
																	?.toLowerCase()
																	.includes(search) ||
																teacher.position
																	?.toLowerCase()
																	.includes(search) ||
																teacher.specialization
																	?.toLowerCase()
																	.includes(search)
															);
														})
														.map((teacher) => (
															<Checkbox
																key={teacher.id}
																value={teacher.id}
																disabled={!selectedSubject}
															>
																<div>
																	<strong>
																		{teacher.user?.fullName}
																	</strong>{" "}
																	({teacher.teacherCode})
																	<div
																		style={{
																			fontSize: 12,
																			color: "#666",
																		}}
																	>
																		{teacher.department} -{" "}
																		{teacher.position} -{" "}
																		{teacher.specialization}
																	</div>
																</div>
															</Checkbox>
														))}
												</div>
											</Checkbox.Group>
										</Card>
									</Space>
								</div>
							),
						},
					]}
				/>
			</Modal>
		</div>
	);
}