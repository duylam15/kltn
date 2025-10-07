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
} from "antd";
import {
	ReloadOutlined,
	SearchOutlined,
	PlusOutlined,
	DeleteOutlined,
	UserOutlined,
	BookOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { GraduationCap, Layers, UserCog } from "lucide-react";

const { Title } = Typography;
const API_BASE = "http://localhost:4000/api/v1";

type User = {
	id: number;
	email: string;
	fullName: string;
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

type Term = {
	id: number;
	code: string;
	name: string;
	startDate: string;
	endDate: string;
};

type CourseSection = {
	id: number;
	subjectId: number;
	termId: number;
	sectionCode: string;
	sectionName: string;
	schedule: any;
	maxStudents: number;
	currentStudents: number;
	status: string;
	subject?: Subject;
	term?: Term;
	instructors?: any[];
};

type Instructor = {
	sectionId: number;
	teacherId: number;
	role: string;
	assignedAt: string;
	section?: CourseSection;
	teacher?: Teacher;
};

export default function Instructors() {
	const [loading, setLoading] = useState(true);
	const [instructors, setInstructors] = useState<Instructor[]>([]);
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
	const [keyword, setKeyword] = useState("");

	// modal thêm phân công
	const [modalOpen, setModalOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"byTeacher" | "bySection">("byTeacher");

	// Thêm theo giảng viên
	const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
	const [selectedSections, setSelectedSections] = useState<number[]>([]);

	// Thêm theo môn học
	const [selectedSection, setSelectedSection] = useState<number | null>(null);
	const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);

	// Tìm kiếm trong modal
	const [searchSection, setSearchSection] = useState("");
	const [searchTeacher, setSearchTeacher] = useState("");

	useEffect(() => {
		fetchInstructors();
		fetchTeachers();
		fetchCourseSections();
	}, []);

	// Cập nhật selectedSections khi chọn giảng viên
	useEffect(() => {
		if (selectedTeacher) {
			const assignedSections = instructors
				.filter((i) => i.teacherId === selectedTeacher)
				.map((i) => i.sectionId);
			setSelectedSections(assignedSections);
		} else {
			setSelectedSections([]);
		}
	}, [selectedTeacher, instructors]);

	// Cập nhật selectedTeachers khi chọn môn học
	useEffect(() => {
		if (selectedSection) {
			const assignedTeachers = instructors
				.filter((i) => i.sectionId === selectedSection)
				.map((i) => i.teacherId);
			setSelectedTeachers(assignedTeachers);
		} else {
			setSelectedTeachers([]);
		}
	}, [selectedSection, instructors]);

	async function fetchInstructors() {
		try {
			setLoading(true);
			const res = await axios.get<{ success: boolean; data: Instructor[] }>(
				`${API_BASE}/sections-instructors`
			);
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
			const res = await axios.get<{ success: boolean; data: Teacher[] }>(
				`${API_BASE}/teachers`
			);
			if (res.data.success) {
				setTeachers(res.data.data || []);
			}
		} catch (err) {
			console.error("Không tải được danh sách giảng viên");
		}
	}

	async function fetchCourseSections() {
		try {
			const res = await axios.get<{ success: boolean; data: CourseSection[] }>(
				`${API_BASE}/course-sections`
			);
			if (res.data.success) {
				setCourseSections(res.data.data || []);
			}
		} catch (err) {
			console.error("Không tải được danh sách môn học");
		}
	}

	const handleDelete = async (sectionId: number, teacherId: number) => {
		try {
			await axios.delete(`${API_BASE}/sections-instructors/${sectionId}/${teacherId}`);
			toast.success("Đã xóa phân công");
			setInstructors((prev) =>
				prev.filter((i) => !(i.sectionId === sectionId && i.teacherId === teacherId))
			);
		} catch (err) {
			toast.error("Không thể xóa phân công");
		}
	};

	const handleAssign = async () => {
		try {
			if (activeTab === "byTeacher") {
				if (!selectedTeacher) {
					toast.error("Vui lòng chọn giảng viên");
					return;
				}

				// Lấy danh sách phân công hiện tại của giảng viên
				const currentAssignments = instructors
					.filter((i) => i.teacherId === selectedTeacher)
					.map((i) => i.sectionId);

				// Tìm các môn cần thêm (có trong selectedSections nhưng không có trong currentAssignments)
				const toAdd = selectedSections.filter((sid) => !currentAssignments.includes(sid));

				// Tìm các môn cần xóa (có trong currentAssignments nhưng không có trong selectedSections)
				const toRemove = currentAssignments.filter((sid) => !selectedSections.includes(sid));

				// Thêm phân công mới
				for (const sectionId of toAdd) {
					await axios.post(`${API_BASE}/sections-instructors`, {
						sectionId,
						teacherId: selectedTeacher,
						role: "owner",
					});
				}

				// Xóa phân công cũ
				for (const sectionId of toRemove) {
					await axios.delete(`${API_BASE}/sections-instructors/${sectionId}/${selectedTeacher}`);
				}

				if (toAdd.length > 0 || toRemove.length > 0) {
					toast.success(`Đã cập nhật phân công (thêm: ${toAdd.length}, xóa: ${toRemove.length})`);
				} else {
					toast.error("Không có thay đổi nào");
				}
			} else {
				if (!selectedSection) {
					toast.error("Vui lòng chọn môn học");
					return;
				}

				// Lấy danh sách giảng viên hiện tại của môn học
				const currentAssignments = instructors
					.filter((i) => i.sectionId === selectedSection)
					.map((i) => i.teacherId);

				// Tìm các giảng viên cần thêm
				const toAdd = selectedTeachers.filter((tid) => !currentAssignments.includes(tid));

				// Tìm các giảng viên cần xóa
				const toRemove = currentAssignments.filter((tid) => !selectedTeachers.includes(tid));

				// Thêm phân công mới
				for (const teacherId of toAdd) {
					await axios.post(`${API_BASE}/sections-instructors`, {
						sectionId: selectedSection,
						teacherId,
						role: "owner",
					});
				}

				// Xóa phân công cũ
				for (const teacherId of toRemove) {
					await axios.delete(`${API_BASE}/sections-instructors/${selectedSection}/${teacherId}`);
				}

				if (toAdd.length > 0 || toRemove.length > 0) {
					toast.success(`Đã cập nhật phân công (thêm: ${toAdd.length}, xóa: ${toRemove.length})`);
				} else {
					toast.error("Không có thay đổi nào");
				}
			}

			setModalOpen(false);
			resetModal();
			fetchInstructors();
		} catch (err: any) {
			const errorMsg = err?.response?.data?.message || "Không thể cập nhật phân công";
			toast.error(errorMsg);
		}
	};

	const resetModal = () => {
		setSelectedTeacher(null);
		setSelectedSections([]);
		setSelectedSection(null);
		setSelectedTeachers([]);
		setActiveTab("byTeacher");
		setSearchSection("");
		setSearchTeacher("");
	};

	const columns = [
		{
			title: "Môn học",
			key: "subject",
			render: (_: any, record: Instructor) => (
				<div>
					<div>
						<strong>{record.section?.subject?.subjectCode}</strong> -{" "}
						{record.section?.subject?.subjectName}
					</div>
					<div style={{ fontSize: 12, color: "#666" }}>
						{record.section?.sectionCode} - {record.section?.sectionName}
					</div>
				</div>
			),
		},
		{
			title: "Học kỳ",
			key: "term",
			render: (_: any, record: Instructor) => (
				<div>
					<div>{record.section?.term?.name}</div>
					<div style={{ fontSize: 12, color: "#666" }}>
						{record.section?.term?.code}
					</div>
				</div>
			),
		},
		{
			title: "Giảng viên",
			key: "teacher",
			render: (_: any, record: Instructor) => (
				<div>
					<div>
						<strong>{record.teacher?.user?.fullName}</strong>
					</div>
					<div style={{ fontSize: 12, color: "#666" }}>
						{record.teacher?.teacherCode} - {record.teacher?.user?.email}
					</div>
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
			title: "Vai trò",
			dataIndex: "role",
			key: "role",
			render: (role: string) => (
				<Tag color={role === "owner" ? "green" : "default"}>
					{role === "owner" ? "Chủ nhiệm" : role}
				</Tag>
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
			render: (_: any, record: Instructor) => (
				<Tooltip title="Xóa phân công">
					<Popconfirm
						title="Xóa phân công"
						description="Bạn có chắc muốn xóa phân công này?"
						okText="Xóa"
						cancelText="Hủy"
						okButtonProps={{ danger: true }}
						onConfirm={() => handleDelete(record.sectionId, record.teacherId)}
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
			i.section?.subject?.subjectCode?.toLowerCase().includes(kw) ||
			i.section?.subject?.subjectName?.toLowerCase().includes(kw) ||
			i.section?.sectionCode?.toLowerCase().includes(kw) ||
			i.teacher?.user?.fullName?.toLowerCase().includes(kw) ||
			i.teacher?.teacherCode?.toLowerCase().includes(kw) ||
			i.teacher?.department?.toLowerCase().includes(kw)
		);
	});

	return (
		<div className="pl-3 pr-3">
			<div style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				marginBottom: 16,
			}}>
				<Title level={3} className="mt-2">
					<div className="flex items-center gap-2">
						<UserCog /> Quản lý phân công
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
						Thêm phân công
					</Button>
				</div>
			</div>

			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<Spin size="large" tip="Đang tải danh sách phân công..." />
				</div>
			) : (
				<Table<Instructor>
					dataSource={filteredInstructors}
					columns={columns}
					rowKey={(record) => `${record.sectionId}-${record.teacherId}`}
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
				title="Thêm phân công giảng viên"
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					resetModal();
				}}
				onOk={handleAssign}
				okText="Phân công"
				cancelText="Hủy"
				width={700}
				centered
				bodyStyle={{
					maxHeight: "70vh", // Giới hạn chiều cao modal
					height: "70vh",
					overflowY: "auto", // Thêm scroll dọc
				}}
			>
				<Tabs
					activeKey={activeTab}
					onChange={(key) => setActiveTab(key as "byTeacher" | "bySection")}
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
									<Space direction="vertical" style={{ width: "100%" }} size="small" >
										<Card size="small" title="1. Chọn giảng viên"
										>
											<Select
												showSearch
												style={{ width: "100%" }}
												placeholder="Chọn giảng viên"
												value={selectedTeacher}
												onChange={setSelectedTeacher}
												filterOption={(input, option) =>
													(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
												}
												options={teachers.map((t) => ({
													value: t.id,
													label: `${t.user?.fullName} (${t.teacherCode}) - ${t.department}`,
												}))}
											/>
										</Card>

										<Card size="small" title="2. Chọn các môn học cần phân công">
											<Input
												allowClear
												prefix={<SearchOutlined />}
												placeholder="Tìm kiếm môn học..."
												value={searchSection}
												onChange={(e) => setSearchSection(e.target.value)}
												style={{ marginBottom: 12 }}
											/>
											<Checkbox.Group
												style={{ width: "100%" }}
												value={selectedSections}
												onChange={setSelectedSections}
											>
												<div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }} className="w-[100%]">
													{courseSections
														.filter((section) => {
															if (!searchSection) return true;
															const search = searchSection.toLowerCase();
															return (
																section.subject?.subjectCode?.toLowerCase().includes(search) ||
																section.subject?.subjectName?.toLowerCase().includes(search) ||
																section.sectionCode?.toLowerCase().includes(search) ||
																section.sectionName?.toLowerCase().includes(search) ||
																section.term?.name?.toLowerCase().includes(search)
															);
														})
														.map((section) => (
															<Checkbox
																key={section.id}
																value={section.id}
																disabled={!selectedTeacher}
															>
																<div>
																	<strong>{section.subject?.subjectCode}</strong> -{" "}
																	{section.subject?.subjectName}
																	<div style={{ fontSize: 12, color: "#666" }}>
																		{section.sectionCode} - {section.sectionName} - {section.term?.name}
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
							key: "bySection",
							label: (
								<span>
									<BookOutlined /> Theo môn học
								</span>
							),
							children: (
								<div style={{ marginTop: -20 }}>
									<Space direction="vertical" style={{ width: "100%" }} size="small">
										<Card size="small" title="1. Chọn môn học">
											<Select
												showSearch
												style={{ width: "100%" }}
												placeholder="Chọn môn học"
												value={selectedSection}
												onChange={setSelectedSection}
												filterOption={(input, option) =>
													(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
												}
												options={courseSections.map((s) => ({
													value: s.id,
													label: `${s.subject?.subjectCode} - ${s.subject?.subjectName} (${s.sectionCode}) - ${s.term?.name}`,
												}))}
											/>
										</Card>

										<Card size="small" title="2. Chọn các giảng viên cần phân công">
											<Input
												allowClear
												prefix={<SearchOutlined />}
												placeholder="Tìm kiếm giảng viên..."
												value={searchTeacher}
												onChange={(e) => setSearchTeacher(e.target.value)}
												style={{ marginBottom: 12 }}
											/>
											<Checkbox.Group
												style={{ width: "100%" }}
												value={selectedTeachers}
												onChange={setSelectedTeachers}
											>
												<div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }} className="w-[100%]">
													{teachers
														.filter((teacher) => {
															if (!searchTeacher) return true;
															const search = searchTeacher.toLowerCase();
															return (
																teacher.user?.fullName?.toLowerCase().includes(search) ||
																teacher.teacherCode?.toLowerCase().includes(search) ||
																teacher.department?.toLowerCase().includes(search) ||
																teacher.position?.toLowerCase().includes(search) ||
																teacher.specialization?.toLowerCase().includes(search)
															);
														})
														.map((teacher) => (
															<Checkbox key={teacher.id} value={teacher.id}>
																<div>
																	<strong>{teacher.user?.fullName}</strong> ({teacher.teacherCode})
																	<div style={{ fontSize: 12, color: "#666" }}>
																		{teacher.department} - {teacher.position} - {teacher.specialization}
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