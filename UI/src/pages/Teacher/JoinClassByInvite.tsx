import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Alert, Result, Typography } from "antd";
import { UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import instance from "../../utils/axiosInstance";


export default function JoinClassByInvite() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [form] = Form.useForm();

	const code = searchParams.get("code");
	const sectionId = Number(searchParams.get("section"));
	const defaultPassword = searchParams.get("pwd") || "123456";

	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleJoin = async (values: { studentCode: string }) => {
		try {
			setSubmitting(true);
			const studentCode = values.studentCode.trim();

			// Bước 1: Tìm sinh viên theo MSSV qua endpoint mới
			let studentId: number | null = null;
			let studentExists = false;

			try {
				console.log(`🔍 Searching for student with code: ${studentCode}`);
				const searchRes = await instance.get(`/students/code/${studentCode}`);

				if (searchRes.data.success && searchRes.data.data) {
					// Đã có tài khoản
					studentId = searchRes.data.data.id;
					studentExists = true;
					console.log(`✅ Found existing student:`, searchRes.data.data);
					console.log(`Student ID: ${studentId}, Name: ${searchRes.data.data.user.fullName}`);
				}
			} catch (error: any) {
				// Nếu lỗi 404 hoặc không tìm thấy -> chưa có tài khoản
				if (error.response?.status === 404) {
					console.log(`⚠️ Student not found, will create new account`);
					studentExists = false;
				} else {
					console.error("Error searching student:", error);
					throw error;
				}
			}

			// Bước 2: Nếu chưa có tài khoản -> Tạo mới
			if (!studentExists) {
				console.log(`➜ Creating new student account with code: ${studentCode}`);

				const createPayload = {
					studentCode,
					password: defaultPassword,
					fullName: `Sinh viên ${studentCode}`, // Tên tạm, sinh viên sẽ cập nhật sau
					email: `${studentCode}@student.edu.vn`, // Email tạm
					className: "N/A",
					major: "Information Technology",
				};

				try {
					const createRes = await instance.post(`/students`, createPayload);

					if (createRes.data.success && createRes.data.data) {
						studentId = createRes.data.data.student.id;
						console.log(`✅ Created new student with ID: ${studentId}`);
					} else {
						throw new Error(createRes.data.message || "Không thể tạo tài khoản");
					}
				} catch (createError: any) {
					console.error("Error creating student:", createError);
					const createErrorMsg = createError.response?.data?.message || createError.message || "";

					// Kiểm tra nếu sinh viên vừa được tạo bởi request khác
					if (createErrorMsg.includes("already exists") || createErrorMsg.includes("đã tồn tại")) {
						console.log("⚠️ Student was just created, trying to fetch again...");
						try {
							const retryRes = await instance.get(`/students/code/${studentCode}`);
							if (retryRes.data.success && retryRes.data.data) {
								studentId = retryRes.data.data.id;
								console.log(`✅ Retrieved student ID after retry: ${studentId}`);
							}
						} catch (retryError) {
							throw createError;
						}
					} else {
						throw createError;
					}
				}
			}

			// Bước 3: Thêm vào lớp
			if (studentId) {
				console.log(`➜ Enrolling student ${studentId} into section ${sectionId}`);

				const enrollPayload = {
					sectionId,
					studentId,
				};

				try {
					const enrollRes = await instance.post(`/sections-enrollments`, enrollPayload);

					if (enrollRes.data.success) {
						console.log(`✅ Successfully enrolled student into class`);
						setSuccess(true);
						toast.success("Đăng ký vào lớp thành công!");

						setTimeout(() => {
							navigate("/login");
						}, 3000);
					} else {
						throw new Error(enrollRes.data.message || "Không thể đăng ký vào lớp");
					}
				} catch (enrollError: any) {
					console.error("Error enrolling:", enrollError);
					const enrollErrorMsg = enrollError.response?.data?.message || enrollError.message || "";

					// Kiểm tra nếu đã có trong lớp
					if (enrollErrorMsg.includes("already enrolled") || enrollErrorMsg.includes("đã đăng ký")) {
						console.log("⚠️ Student already enrolled in this class");
						toast.success("Bạn đã có trong lớp này rồi!");
						setSuccess(true);
						setTimeout(() => navigate("/login"), 3000);
					} else {
						throw enrollError;
					}
				}
			} else {
				throw new Error("Không thể lấy thông tin sinh viên");
			}
		} catch (err: any) {
			console.error("❌ Error in handleJoin:", err);
			const errorMsg = err.response?.data?.message || err.message || "Không thể đăng ký vào lớp";
			toast.error(errorMsg);

			// Hiển thị lỗi trong form nếu liên quan đến MSSV
			if (errorMsg.includes("MSSV") || errorMsg.includes("student code") || errorMsg.includes("studentCode")) {
				form.setFields([
					{
						name: "studentCode",
						errors: [errorMsg],
					},
				]);
			}
		} finally {
			setSubmitting(false);
		}
	};

	if (!code || !sectionId) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					padding: 20,
				}}
			>
				<Card style={{ maxWidth: 500, width: "100%" }}>
					<Result
						status="error"
						title="Mã mời không hợp lệ"
						subTitle="Link tham gia không đúng định dạng"
						extra={
							<Button type="primary" onClick={() => navigate("/")}>
								Về trang chủ
							</Button>
						}
					/>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
					padding: 20,
				}}
			>
				<Card style={{ maxWidth: 500, width: "100%" }}>
					<Result
						status="success"
						icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
						title="Đăng ký thành công!"
						subTitle="Bạn đã được thêm vào lớp học. Đang chuyển hướng đến trang đăng nhập..."
						extra={
							<Button type="primary" onClick={() => navigate("/login")}>
								Đăng nhập ngay
							</Button>
						}
					/>
				</Card>
			</div>
		);
	}

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				padding: 20,
			}}
		>
			<Card
				style={{
					maxWidth: 500,
					width: "100%",
					boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
					borderRadius: 12,
				}}
			>
				<div style={{ textAlign: "center", marginBottom: 24 }}>
					<Typography.Title level={3} style={{ marginBottom: 8 }}>
						Tham gia lớp học
					</Typography.Title>
					<Typography.Text type="secondary">
						Nhập mã số sinh viên để tham gia
					</Typography.Text>
				</div>

				<Alert
					message="Lưu ý"
					description={
						<ul style={{ marginBottom: 0, paddingLeft: 20, fontSize: 13 }}>
							<li><strong>Nếu bạn đã có tài khoản:</strong> Bạn sẽ được thêm vào lớp ngay lập tức</li>
							<li>
								<strong>Nếu bạn chưa có tài khoản:</strong> Hệ thống sẽ tự động tạo tài khoản mới với mật khẩu: <strong style={{ color: '#1890ff' }}>{defaultPassword}</strong>
							</li>
							<li>Bạn có thể đổi mật khẩu sau khi đăng nhập</li>
						</ul>
					}
					type="info"
					showIcon
					style={{ marginBottom: 24 }}
				/>

				<Form form={form} layout="vertical" onFinish={handleJoin}>
					<Form.Item
						name="studentCode"
						label="Mã số sinh viên"
						rules={[
							{ required: true, message: "Vui lòng nhập mã số sinh viên" },
							{
								pattern: /^[0-9]{6,12}$/,
								message: "MSSV phải là số và có từ 6-12 ký tự",
							},
						]}
					>
						<Input
							prefix={<UserOutlined />}
							placeholder="Nhập MSSV của bạn (VD: 3122410208)"
							size="large"
							autoFocus
						/>
					</Form.Item>

					<Form.Item style={{ marginBottom: 0 }}>
						<Button
							type="primary"
							htmlType="submit"
							loading={submitting}
							block
							size="large"
							style={{ marginTop: 8 }}
						>
							{submitting ? "Đang xử lý..." : "Tham gia lớp học"}
						</Button>
					</Form.Item>
				</Form>

				<div style={{ marginTop: 24, textAlign: "center" }}>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						Mật khẩu mặc định cho tài khoản mới: <strong>{defaultPassword}</strong>
					</Typography.Text>
					<br />
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						Bạn gặp vấn đề? Liên hệ giảng viên để được hỗ trợ
					</Typography.Text>
				</div>
			</Card>
		</div>
	);
}