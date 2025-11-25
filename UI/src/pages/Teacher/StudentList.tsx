import React, { useEffect, useState, useRef } from "react";
import {
	Table,
	Button,
	Spin,
	Typography,
	Tag,
	Modal,
	Form,
	Input,
	Select,
	Popconfirm,
	Tooltip,
	Space,
	Upload,
	Alert,
	Card,
	Divider,
	message,
} from "antd";
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	ReloadOutlined,
	SearchOutlined,
	UserOutlined,
	TeamOutlined,
	CheckCircleOutlined,
	WarningOutlined,
	UploadOutlined,
	DownloadOutlined,
	QrcodeOutlined,
	CopyOutlined,
	LinkOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import type { InputRef } from "antd";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { QRCodeSVG } from "qrcode.react";

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

type ImportStudent = {
	studentCode: string;
	firstName: string;
	lastName: string;
	fullName: string;
	email: string;
	phone?: string;
	className: string;
	classFullName?: string;
	dateOfBirth?: string;
};

type ImportResult = {
	success: number;
	failed: number;
	skipped: number;
	errors: Array<{
		row: number;
		studentCode: string;
		fullName: string;
		error: string;
	}>;
};

type InviteCode = {
	sectionId: number;
	code: string;
	defaultPassword: string;
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
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [editing, setEditing] = useState<Enrollment | null>(null);
	const [assigningStudent, setAssigningStudent] = useState<Enrollment | null>(null);

	// Import states
	const [importFile, setImportFile] = useState<File | null>(null);
	const [importData, setImportData] = useState<ImportStudent[]>([]);
	const [importLoading, setImportLoading] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);

	// Invite states
	const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);

	const [form] = Form.useForm();
	const [addForm] = Form.useForm();
	const [groupForm] = Form.useForm();
	const [inviteForm] = Form.useForm();

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
				const enrollmentsData = enrollmentsRes.data.data || [];
				setEnrollments(enrollmentsData);
			}

			if (groupsRes.data.success) {
				const groupsData = groupsRes.data.data || [];
				setGroups(groupsData);

				const groupMap: Record<number, Group> = {};
				groupsData.forEach((group) => {
					group.enrollments?.forEach((enrollment) => {
						groupMap[enrollment.studentId] = group;
					});
				});

				setEnrollments((prev) =>
					prev.map((enrollment) => ({
						...enrollment,
						group: groupMap[enrollment.studentId] || undefined,
						groupId: groupMap[enrollment.studentId]?.id || undefined,
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

	const refresh = () => {
		setKeyword("");
		fetchData();
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
				toast.error(
					enrollmentRes.data.message || "Sinh viên đã tạo nhưng không thể gán vào lớp"
				);
				fetchData();
			}
		} catch (err: any) {
			if (err?.errorFields) return;

			const status = err.response?.status;
			const msg: string = err.response?.data?.message || "Không thể thêm sinh viên";

			if (status === 409) {
				if (/student code/i.test(msg)) {
					addForm.setFields([{ name: "studentCode", errors: ["MSSV đã tồn tại"] }]);
					addForm.scrollToField("studentCode");
					setTimeout(() => studentCodeRef.current?.focus({ cursor: "end" }), 0);
					return;
				}
			}

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
				phone: editing.student.user.phone,
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

			const userPayload = {
				email: values.email?.trim(),
				fullName: values.fullName?.trim(),
				phone: values.phone?.trim() || null,
			};

			const res = await axios.patch(
				`${API_BASE}/users/${editing.student.user.id}`,
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
			if (err?.errorFields) return;
			console.error("Lỗi update:", err);
			toast.error(
				err.response?.data?.message || "Không thể cập nhật thông tin người dùng"
			);
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
			if (err?.errorFields) return;
			console.error("Lỗi assign group:", err);
			toast.error(err.response?.data?.message || "Không thể phân nhóm");
		}
	};

	// ============ INVITE CODE FUNCTIONS ============
	const handleGenerateInviteCode = () => {
		const values = inviteForm.getFieldsValue();
		const code = `${sectionId}-${Date.now().toString(36)}`;

		setInviteCode({
			sectionId,
			code,
			defaultPassword: values.defaultPassword || "123456",
		});

		toast.success("Tạo mã mời thành công!");
	};

	const handleCopyInviteLink = () => {
		if (!inviteCode) return;
		const inviteLink = `${window.location.origin}/join?code=${inviteCode.code}&section=${sectionId}&pwd=${inviteCode.defaultPassword}`;
		navigator.clipboard.writeText(inviteLink);
		message.success("Đã sao chép link mời!");
	};

	const handleCopyInviteCode = () => {
		if (!inviteCode) return;
		navigator.clipboard.writeText(inviteCode.code);
		message.success("Đã sao chép mã mời!");
	};

	const handleDownloadQR = () => {
		const svg = document.querySelector("#qr-code-container svg");
		if (!svg) return;

		const svgData = new XMLSerializer().serializeToString(svg);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx?.drawImage(img, 0, 0);

			canvas.toBlob((blob) => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					const link = document.createElement("a");
					link.download = `ma-moi-lop-${sectionId}.png`;
					link.href = url;
					link.click();
					URL.revokeObjectURL(url);
					message.success("Đã tải xuống mã QR!");
				}
			});
		};

		img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
	};

	const handleCloseInviteModal = () => {
		setInviteModalOpen(false);
		setInviteCode(null);
		inviteForm.resetFields();
	};

	// ============ IMPORT FUNCTIONS ============
	const parseExcelDate = (excelDate: any): string | undefined => {
		if (!excelDate) return undefined;

		if (typeof excelDate === "number") {
			const date = XLSX.SSF.parse_date_code(excelDate);
			return `${String(date.d).padStart(2, "0")}/${String(date.m).padStart(2, "0")}/${date.y}`;
		}

		if (typeof excelDate === "string") {
			if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(excelDate)) {
				return excelDate;
			}
			if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(excelDate)) {
				const [y, m, d] = excelDate.split("-");
				return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
			}
		}

		return undefined;
	};

	const normalizePhoneNumber = (phone: any): string | undefined => {
		if (!phone) return undefined;

		let phoneStr = String(phone).trim().replace(/[\s\-\.]/g, '');
		phoneStr = phoneStr.replace(/[^\d+]/g, '');

		if (phoneStr.startsWith('+84')) {
			phoneStr = '0' + phoneStr.substring(3);
		}

		if (phoneStr.startsWith('84') && phoneStr.length > 10) {
			phoneStr = '0' + phoneStr.substring(2);
		}

		if (!/^0\d{9,10}$/.test(phoneStr)) {
			console.warn(`Invalid phone format: ${phone} -> ${phoneStr}`);
			return undefined;
		}

		return phoneStr;
	};

	const handleFileUpload = (file: File) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = new Uint8Array(e.target?.result as ArrayBuffer);
				const workbook = XLSX.read(data, { type: "array" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

				let headerRowIndex = -1;
				for (let i = 0; i < Math.min(20, jsonData.length); i++) {
					const row = jsonData[i];
					if (row.some((cell) => String(cell).includes("Mã SV"))) {
						headerRowIndex = i;
						break;
					}
				}

				if (headerRowIndex === -1) {
					toast.error("Không tìm thấy header trong file Excel");
					return;
				}

				const headers = jsonData[headerRowIndex].map((h) => String(h).trim());
				const dataRows = jsonData.slice(headerRowIndex + 1);

				const colMap: any = {};
				headers.forEach((header, index) => {
					if (header.includes("Mã SV")) colMap.studentCode = index;
					if (header.includes("Họ lót")) colMap.firstName = index;
					if (header.includes("Tên") && !header.includes("Họ") && !header.includes("lớp")) colMap.lastName = index;
					if (header.includes("Email")) colMap.email = index;
					if (header.includes("Điện thoại")) colMap.phone = index;
					if (header.includes("Mã lớp")) colMap.className = index;
					if (header.includes("Tên lớp")) colMap.classFullName = index;
					if (header.includes("Ngày sinh")) colMap.dateOfBirth = index;
				});

				const students: ImportStudent[] = dataRows
					.filter((row) => row[colMap.studentCode])
					.map((row) => {
						const firstName = String(row[colMap.firstName] || "").trim();
						const lastName = String(row[colMap.lastName] || "").trim();
						const fullName = `${firstName} ${lastName}`.trim();
						const phone = normalizePhoneNumber(row[colMap.phone]);

						let major = "Information Technology";
						const classFullName = String(row[colMap.classFullName] || "");
						if (classFullName.includes("Kỹ thuật phần mềm")) {
							major = "Software Engineering";
						} else if (classFullName.includes("Công nghệ thông tin")) {
							major = "Information Technology";
						}

						return {
							studentCode: String(row[colMap.studentCode]).trim(),
							firstName,
							lastName,
							fullName,
							email: String(row[colMap.email] || "").trim(),
							phone,
							className: String(row[colMap.className] || "").trim(),
							classFullName,
							dateOfBirth: parseExcelDate(row[colMap.dateOfBirth]),
						};
					});

				setImportData(students);
				setImportFile(file);
				toast.success(`Đã đọc được ${students.length} sinh viên từ file`);
			} catch (error) {
				console.error("Error parsing Excel:", error);
				toast.error("Lỗi khi đọc file Excel");
			}
		};

		reader.readAsArrayBuffer(file);
		return false;
	};

	const handleImport = async () => {
		if (importData.length === 0) {
			toast.error("Chưa có dữ liệu để import");
			return;
		}

		setImportLoading(true);
		const result: ImportResult = {
			success: 0,
			failed: 0,
			skipped: 0,
			errors: [],
		};

		let allStudents: any[] = [];
		try {
			const allStudentsRes = await axios.get(`${API_BASE}/students?limit=1000`);
			if (allStudentsRes.data.success && allStudentsRes.data.data) {
				allStudents = allStudentsRes.data.data;
			}
		} catch (error) {
			console.error("Error loading students:", error);
			toast.error("Không thể tải danh sách sinh viên");
			setImportLoading(false);
			return;
		}

		for (let i = 0; i < importData.length; i++) {
			const student = importData[i];
			try {
				let major = "Information Technology";
				if (student.classFullName) {
					if (student.classFullName.includes("Kỹ thuật phần mềm")) {
						major = "Software Engineering";
					} else if (student.classFullName.includes("Công nghệ thông tin")) {
						major = "Information Technology";
					}
				}

				let studentId: number | null = null;

				const normalizedStudentCode = String(student.studentCode).trim();
				const normalizedEmail = String(student.email).trim().toLowerCase();

				let existingStudent = allStudents.find(
					(s: any) =>
						String(s.studentCode).trim() === normalizedStudentCode ||
						String(s.user?.email || "").trim().toLowerCase() === normalizedEmail
				);

				if (!existingStudent) {
					try {
						const searchByCodeRes = await axios.get(`${API_BASE}/students?studentCode=${student.studentCode}`);

						if (searchByCodeRes.data.success && searchByCodeRes.data.data && searchByCodeRes.data.data.length > 0) {
							existingStudent = searchByCodeRes.data.data.find(
								(s: any) => String(s.studentCode).trim() === normalizedStudentCode
							);
						}

						if (!existingStudent) {
							try {
								const searchByEmailRes = await axios.get(`${API_BASE}/students?email=${student.email}`);

								if (searchByEmailRes.data.success && searchByEmailRes.data.data && searchByEmailRes.data.data.length > 0) {
									existingStudent = searchByEmailRes.data.data.find(
										(s: any) => String(s.user?.email || "").trim().toLowerCase() === normalizedEmail
									);
								}
							} catch (emailSearchError) {
								// Không tìm thấy qua email
							}
						}

						if (existingStudent) {
							allStudents.push(existingStudent);
						}
					} catch (searchError) {
						console.log(`Student ${student.studentCode} not found in database`);
					}
				}

				if (existingStudent) {
					studentId = existingStudent.id;
				} else {
					try {
						const fullName = `${student.firstName} ${student.lastName}`.trim();

						const studentPayload: any = {
							studentCode: student.studentCode,
							password: "123456",
							fullName: fullName,
							email: student.email,
							className: student.className,
							major: major,
						};

						if (student.phone) {
							studentPayload.phone = student.phone;
						}

						if (student.dateOfBirth) {
							studentPayload.dateOfBirth = student.dateOfBirth;
						}

						const studentRes = await axios.post(`${API_BASE}/students`, studentPayload);

						if (studentRes.data.success) {
							studentId = studentRes.data.data.student.id;
							const newStudent = {
								id: studentId,
								studentCode: student.studentCode,
								...studentRes.data.data.student
							};
							allStudents.push(newStudent);
						} else {
							throw new Error(studentRes.data.message || "Không thể tạo sinh viên");
						}
					} catch (createError: any) {
						const createErrorMsg = createError.response?.data?.message || createError.message || "";

						if (createErrorMsg.includes("already exists") || createErrorMsg.includes("đã tồn tại")) {
							try {
								const fetchRes = await axios.get(`${API_BASE}/students?studentCode=${student.studentCode}`);
								if (fetchRes.data.success && fetchRes.data.data && fetchRes.data.data.length > 0) {
									existingStudent = fetchRes.data.data[0];
									studentId = existingStudent.id;
									allStudents.push(existingStudent);
								} else {
									throw createError;
								}
							} catch {
								throw createError;
							}
						} else {
							throw createError;
						}
					}
				}

				if (studentId !== null) {
					try {
						const enrollmentPayload = {
							sectionId,
							studentId,
						};

						const enrollmentRes = await axios.post(
							`${API_BASE}/sections-enrollments`,
							enrollmentPayload
						);

						if (enrollmentRes.data.success) {
							result.success++;
						} else {
							throw new Error(enrollmentRes.data.message || "Không thể đăng ký vào lớp");
						}
					} catch (enrollError: any) {
						const enrollErrorMsg = enrollError.response?.data?.message || enrollError.message || "";

						if (enrollErrorMsg.includes("already enrolled") ||
							enrollErrorMsg.includes("đã đăng ký")) {
							result.skipped++;
						} else {
							throw enrollError;
						}
					}
				} else {
					throw new Error("Không thể lấy ID sinh viên");
				}

			} catch (error: any) {
				result.failed++;
				const errorMessage = error.response?.data?.message || error.message || "Lỗi không xác định";
				result.errors.push({
					row: i + 2,
					studentCode: student.studentCode,
					fullName: student.fullName,
					error: errorMessage,
				});
			}

			if (i < importData.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 150));
			}
		}

		setImportLoading(false);
		setImportResult(result);

		const messages = [];
		if (result.success > 0) {
			messages.push(`✅ Thành công: ${result.success}`);
		}
		if (result.skipped > 0) {
			messages.push(`⚠️ Đã có trong lớp: ${result.skipped}`);
		}
		if (result.failed > 0) {
			messages.push(`❌ Thất bại: ${result.failed}`);
		}

		if (result.success > 0) {
			toast.success(messages.join(" | "));
			fetchData();
		} else if (result.skipped > 0) {
			toast.success(messages.join(" | "));
		} else {
			toast.error(messages.join(" | "));
		}
	};

	const handleCloseImportModal = () => {
		setImportModalOpen(false);
		setImportFile(null);
		setImportData([]);
		setImportResult(null);
	};

	const downloadTemplate = () => {
		const templateData = [
			["Trường Đại học Sài Gòn", "", "", "", "", "", "Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam"],
			["        Phòng Đào tạo Đại học", "", "", "", "", "", "           Độc lập - Tự do - Hạnh phúc"],
			[],
			["", "", "", "BẢNG DANH SÁCH SINH VIÊN MẪU"],
			[],
			["STT", "Mã SV", "Họ lót", "Tên", "Mã lớp", "Tên lớp", "Ngày sinh", "Điện thoại", "Email"],
			["1", "3122410001", "Nguyễn Văn", "An", "DCT1221", "ĐH chính quy - ngành Công nghệ thông tin - K.22 - Lớp 1", "01/01/2004", "0901234567", "nguyenvanan@example.com"],
			["2", "3122410002", "Trần Thị", "Bình", "DCT1221", "ĐH chính quy - ngành Công nghệ thông tin - K.22 - Lớp 1", "15/02/2004", "0912345678", "tranthib@example.com"],
			["3", "3122560001", "Lê Văn", "Cường", "DKP1221", "ĐH chính quy - ngành Kỹ thuật phần mềm - K.22 - Lớp 1", "20/03/2004", "0923456789", "levancuong@example.com"],
		];

		const ws = XLSX.utils.aoa_to_sheet(templateData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "DanhSachSinhVien");

		ws["!cols"] = [
			{ wch: 5 },
			{ wch: 15 },
			{ wch: 20 },
			{ wch: 15 },
			{ wch: 12 },
			{ wch: 50 },
			{ wch: 15 },
			{ wch: 15 },
			{ wch: 35 },
		];

		XLSX.writeFile(wb, "MauDanhSachSinhVien.xlsx");
		toast.success("Đã tải xuống file mẫu");
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
			key: "studentCode",
			width: 120,
			fixed: "left" as const,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student?.studentCode || "").localeCompare(b.student?.studentCode || ""),
			render: (_: any, record: Enrollment) => (
				<div style={{ fontWeight: 600, color: "#1890ff" }}>
					<UserOutlined style={{ marginRight: 8 }} />
					{record.student?.studentCode || "N/A"}
				</div>
			),
		},
		{
			title: "Họ và tên",
			key: "fullName",
			width: 180,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student?.user?.fullName || "").localeCompare(b.student?.user?.fullName || ""),
			render: (_: any, record: Enrollment) => {
				const fullName = record.student?.user?.fullName || "N/A";
				return <span>{fullName}</span>;
			},
		},
		{
			title: "Email",
			key: "email",
			width: 220,
			ellipsis: true,
			sorter: (a: Enrollment, b: Enrollment) =>
				(a.student?.user?.email || "").localeCompare(b.student?.user?.email || ""),
			render: (_: any, record: Enrollment) => (
				<Tooltip title={record.student?.user?.email || "N/A"}>
					{record.student?.user?.email || "N/A"}
				</Tooltip>
			),
		},
		{
			title: "Nhóm",
			key: "group",
			align: "center" as const,
			width: 120,
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
			sorter: (a: Enrollment, b: Enrollment) =>
				new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime(),
			render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
		},
		{
			title: "Hành động",
			key: "actions",
			width: 140,
			fixed: "right" as const,
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
									fullName: record.student?.user?.fullName || "",
									email: record.student?.user?.email || "",
									phone: record.student?.user?.phone || "",
									className: record.student?.className || "",
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
			(enrollment.student.studentCode ?? "").toLowerCase().includes(searchText) ||
			(enrollment.student.user.fullName ?? "").toLowerCase().includes(searchText) ||
			(enrollment.student.user.email ?? "").toLowerCase().includes(searchText) ||
			(enrollment.student.className ?? "").toLowerCase().includes(searchText) ||
			(enrollment.group?.groupName ?? "").toLowerCase().includes(searchText) ||
			(enrollment.group?.groupCode ?? "").toLowerCase().includes(searchText)
		);
	});

	const getStatistics = () => {
		const totalStudents = enrollments.length;
		const studentsWithGroup = enrollments.filter((e) => e.groupId).length;
		const studentsWithoutGroup = totalStudents - studentsWithGroup;

		return {
			totalStudents,
			studentsWithGroup,
			studentsWithoutGroup,
		};
	};

	const stats = getStatistics();

	if (loading) return <Spin tip="Đang tải..." style={{ display: "flex", justifyContent: "center", marginTop: "20%" }} />;

	return (
		<div style={{ padding: 16 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
					marginTop: -16,
				}}
			>
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
						}}
					>
						<UserOutlined style={{ fontSize: 14, color: "#1890ff" }} />
						<span>Tổng SV:</span>
						<strong>{stats.totalStudents}</strong>
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
						}}
					>
						<CheckCircleOutlined style={{ fontSize: 14, color: "#52c41a" }} />
						<span>Đã có nhóm:</span>
						<strong style={{ color: "#52c41a" }}>{stats.studentsWithGroup}</strong>
					</div>

					{stats.studentsWithoutGroup > 0 && (
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
							}}
						>
							<WarningOutlined style={{ fontSize: 14, color: "#ff4d4f" }} />
							<span>Chưa có nhóm:</span>
							<strong style={{ color: "#ff4d4f" }}>
								{stats.studentsWithoutGroup}
							</strong>
						</div>
					)}
				</div>
				<div style={{ display: "flex", justifyItems: "flex-end", gap: 8 }}>
					<Input
						allowClear
						prefix={<SearchOutlined />}
						placeholder="Tìm theo MSSV, tên, email, lớp, nhóm..."
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						style={{ width: 280 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Refresh
					</Button>
					<Button
						type="default"
						icon={<QrcodeOutlined />}
						onClick={() => {
							inviteForm.setFieldsValue({ defaultPassword: "123456" });
							setInviteModalOpen(true);
						}}
					>
						Mã mời
					</Button>
					<Button
						type="default"
						icon={<UploadOutlined />}
						onClick={() => setImportModalOpen(true)}
					>
						Import Excel
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
				pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} sinh viên` }}
				scroll={{ x: 1200 }}
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
							{
								pattern: /^[0-9]{6,12}$/,
								message: "MSSV chỉ gồm số (6–12 ký tự)",
							},
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
						name="email"
						label="Email"
						rules={[
							{ required: true, message: "Vui lòng nhập email" },
							{ type: "email", message: "Email không hợp lệ" },
						]}
					>
						<Input ref={emailRef} placeholder="VD: student@university.edu.vn" />
					</Form.Item>

					<Form.Item
						name="className"
						label="Mã lớp"
						rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
					>
						<Input placeholder="VD: DCT1221" />
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
					<Form.Item name="phone" label="Số điện thoại">
						<Input placeholder="VD: 0123456789" />
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
							<div>
								<strong>MSSV:</strong> {assigningStudent?.student.studentCode}
							</div>
							<div>
								<strong>Họ tên:</strong> {assigningStudent?.student.user.fullName}
							</div>
							<div>
								<strong>Lớp:</strong> {assigningStudent?.student.className}
							</div>
							<div>
								<strong>Nhóm hiện tại:</strong>{" "}
								{getGroupTag(assigningStudent?.group)}
							</div>
						</Space>
					</div>
					<Form.Item name="groupId" label="Chọn nhóm">
						<Select
							placeholder="Chọn nhóm (để trống nếu muốn bỏ nhóm)"
							allowClear
							showSearch
							filterOption={(input, option) =>
								(option?.children as unknown as string)
									?.toLowerCase()
									.includes(input.toLowerCase())
							}
						>
							{groups
								.filter((g) => g.isActive !== false)
								.map((group) => {
									const currentMembers = group.enrollments?.length || 0;
									const maxMembers = group.maxMembers || 0;
									const isFull = currentMembers >= maxMembers;

									return (
										<Option key={group.id} value={group.id} disabled={isFull}>
											{group.groupName ||
												group.groupCode ||
												`Nhóm #${group.id}`}
											{` (${currentMembers}/${maxMembers})`}
											{isFull && " - Đã đầy"}
										</Option>
									);
								})}
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			{/* Modal Mã Mời */}
			<Modal
				title="Tạo mã mời tham gia lớp"
				open={inviteModalOpen}
				onCancel={handleCloseInviteModal}
				footer={null}
				width={700}
			>
				{!inviteCode ? (
					<div>
						<Alert
							message="Hướng dẫn"
							description={
								<ul style={{ marginBottom: 0, paddingLeft: 20 }}>
									<li>Sinh viên quét mã QR hoặc truy cập link để tham gia lớp</li>
									<li>Sinh viên cần nhập MSSV để xác nhận đăng ký</li>
									<li>Nếu chưa có tài khoản, hệ thống sẽ tự động tạo tài khoản mới với mật khẩu bạn cài đặt</li>
									<li>Nếu đã có tài khoản, sinh viên sẽ được thêm vào lớp ngay lập tức</li>
								</ul>
							}
							type="info"
							showIcon
							style={{ marginBottom: 20 }}
						/>

						<Form form={inviteForm} layout="vertical">
							<Form.Item
								name="defaultPassword"
								label="Mật khẩu mặc định cho tài khoản mới"
								rules={[
									{ required: true, message: "Vui lòng nhập mật khẩu mặc định" },
									{ min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
								]}
								tooltip="Mật khẩu này sẽ được sử dụng cho các sinh viên chưa có tài khoản"
								initialValue="123456"
							>
								<Input.Password placeholder="VD: 123456" />
							</Form.Item>

							<Button
								type="primary"
								onClick={handleGenerateInviteCode}
								block
								size="large"
								icon={<QrcodeOutlined />}
							>
								Tạo mã mời
							</Button>
						</Form>
					</div>
				) : (
					<Space direction="vertical" style={{ width: "100%" }} size="large">
						<Alert
							message="Mã mời đã được tạo thành công!"
							description="Sinh viên có thể quét mã QR hoặc truy cập link để tham gia lớp"
							type="success"
							showIcon
						/>

						<Card title="Mã QR Code" size="small">
							<div style={{ textAlign: "center", padding: "20px 0" }} id="qr-code-container">
								<QRCodeSVG
									value={`${window.location.origin}/join?code=${inviteCode.code}&section=${sectionId}&pwd=${inviteCode.defaultPassword}`}
									size={256}
									level="H"
									includeMargin
								/>
							</div>
							<Button
								icon={<DownloadOutlined />}
								onClick={handleDownloadQR}
								block
								style={{ marginTop: 16 }}
							>
								Tải xuống mã QR
							</Button>
						</Card>

						<Card title="Mã mời" size="small">
							<Input
								value={inviteCode.code}
								readOnly
								addonAfter={
									<CopyOutlined
										onClick={handleCopyInviteCode}
										style={{ cursor: "pointer" }}
									/>
								}
							/>
						</Card>

						<Card title="Link tham gia" size="small">
							<Input
								value={`${window.location.origin}/join?code=${inviteCode.code}&section=${sectionId}&pwd=${inviteCode.defaultPassword}`}
								readOnly
								addonAfter={
									<LinkOutlined
										onClick={handleCopyInviteLink}
										style={{ cursor: "pointer" }}
									/>
								}
							/>
						</Card>

						<Divider />

						<Space style={{ width: "100%", justifyContent: "space-between" }}>
							<Button
								onClick={() => {
									setInviteCode(null);
									inviteForm.resetFields();
									inviteForm.setFieldsValue({ defaultPassword: "123456" });
								}}
							>
								Tạo mã mới
							</Button>
							<Button type="primary" onClick={handleCloseInviteModal}>
								Đóng
							</Button>
						</Space>
					</Space>
				)}
			</Modal>
			{/* Modal Import Excel */} <Modal title="Import danh sách sinh viên từ Excel" open={importModalOpen} onCancel={handleCloseImportModal} footer={[<Button key="download" icon={<DownloadOutlined />} onClick={downloadTemplate}> Tải file mẫu </Button>, <Button key="cancel" onClick={handleCloseImportModal}> Đóng </Button>, <Button key="import" type="primary" loading={importLoading} disabled={importData.length === 0} onClick={handleImport} > Import {importData.length > 0 && `(${importData.length} SV)`} </Button>,]} width={1000} > <Space direction="vertical" style={{ width: "100%" }} size="large"> <Alert message="Hướng dẫn" description={<ul style={{ marginBottom: 0, paddingLeft: 20 }}> <li>Tải file mẫu và điền thông tin sinh viên theo định dạng</li> <li> File Excel phải chứa các cột: <strong>Mã SV</strong>, <strong>Họ lót</strong>, <strong>Tên</strong>, <strong>Email</strong>, <strong>Điện thoại</strong>, <strong>Mã lớp</strong>, <strong>Tên lớp</strong> </li> <li><strong>Nếu sinh viên đã có tài khoản:</strong> Chỉ thêm vào lớp, không tạo tài khoản mới</li> <li><strong>Nếu sinh viên chưa có tài khoản:</strong> Tạo tài khoản mới và thêm vào lớp</li> <li>Sinh viên đã có trong lớp sẽ được bỏ qua</li> <li>Số điện thoại phải có định dạng: 10-11 số, bắt đầu bằng 0 (VD: 0901234567)</li> <li>Mật khẩu mặc định cho tài khoản mới: <strong>123456</strong></li> </ul>} type="info" showIcon /> <Upload accept=".xlsx,.xls" beforeUpload={handleFileUpload} maxCount={1} onRemove={() => { setImportFile(null); setImportData([]); setImportResult(null); }} > <Button icon={<UploadOutlined />} block size="large"> Chọn file Excel </Button> </Upload> {importData.length > 0 && !importResult && (<Alert message={`Đã đọc được ${importData.length} sinh viên`} type="success" showIcon />)} {importResult && (<div> <Alert message="Kết quả import" description={<div> <p> <CheckCircleOutlined style={{ color: "#52c41a" }} /> Thành công: {importResult.success} </p> {importResult.skipped > 0 && (<p style={{ color: "#1890ff" }}> ℹ️ Đã có trong lớp (bỏ qua): {importResult.skipped} </p>)} {importResult.failed > 0 && (<p> <WarningOutlined style={{ color: "#ff4d4f" }} /> Thất bại: {importResult.failed} </p>)} </div>} type={importResult.failed > 0 ? "warning" : "success"} showIcon /> {importResult.errors.length > 0 && (<div style={{ marginTop: 16 }}> <Typography.Title level={5}>Chi tiết lỗi:</Typography.Title> <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #d9d9d9", borderRadius: 6, padding: 12, }} > {importResult.errors.map((error, index) => (<div key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: "#fff2e8", borderRadius: 4, }} > <strong>Dòng {error.row}:</strong> {error.studentCode} -{" "} {error.fullName} <br /> <span style={{ color: "#ff4d4f" }}>{error.error}</span> </div>))} </div> </div>)} </div>)} {importData.length > 0 && !importResult && (<div> <Typography.Title level={5}> Danh sách sinh viên sẽ import: </Typography.Title> <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #d9d9d9", borderRadius: 6, }} > <Table dataSource={importData} columns={[{ title: "MSSV", dataIndex: "studentCode", key: "studentCode", width: 120, }, { title: "Họ và tên", dataIndex: "fullName", key: "fullName", width: 180, }, { title: "Email", dataIndex: "email", key: "email", width: 220, }, { title: "Số điện thoại", dataIndex: "phone", key: "phone", width: 130, render: (phone) => phone || <Tag color="default">Chưa có</Tag>, }, { title: "Mã lớp", dataIndex: "className", key: "className", width: 100, },]} rowKey="studentCode" pagination={false} size="small" scroll={{ x: 750 }} /> </div> </div>)} </Space> </Modal>
		</div>
	);
}