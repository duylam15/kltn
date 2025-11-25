// src/pages/Profile/ProfilePage.tsx
import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Tabs,
  Upload,
  Spin,
  Modal,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";

const API_BASE = "http://localhost:4000/api/v1";

type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

type StudentInfo = {
  studentCode: string;
  className?: string | null;
  major?: string | null;
  academicYear?: string | null;
  enrollmentYear?: number | null;
  gpa?: string | null;
  status?: string;
};

type TeacherInfo = {
  teacherCode: string;
  department?: string | null;
  position?: string | null;
  specialization?: string | null;
};


type Profile = {
  id: number;
  fullName: string;
  email: string;
  code: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  lastLogin?: string | null;
  student?: StudentInfo | null;
  teacher?: TeacherInfo | null;
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const userId = user?.id;
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const res = await axios.get(`${API_BASE}/profile/${userId}`);
        if (!res.data) {
          setLoading(false);
          return;
        }

        const data: Profile = res.data.data || res.data;
        setProfile(data);
        

        form.setFieldsValue({
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          email: data.email,
          dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
        });
      } catch (err) {
        console.error("Lỗi khi lấy profile:", err);
        toast.error("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, form]);

  const roleColor: Record<UserRole, "blue" | "green" | "red"> = {
    STUDENT: "blue",
    TEACHER: "green",
    ADMIN: "red",
  };

  // Không cho chọn ngày trong tương lai
  const disabledDate = (current: dayjs.Dayjs) => {
    if (!current) return false;
    return current.isAfter(dayjs(), "day");
  };

  // Upload avatar → POST /profile/:userId/avatar
  const uploadProps: UploadProps = {
    name: "file",
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        if (!userId) {
          toast.error("Chưa đăng nhập.");
          onError && onError(new Error("No user"));
          return;
        }

        setAvatarLoading(true);
        const formData = new FormData();
        formData.append("file", file as Blob);

        const res = await axios.post(
          `${API_BASE}/profile/${userId}/avatar`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        const updated: Profile = res.data.data || res.data;
        setProfile(updated);

        // Cập nhật lại user trong AuthContext để Layout header thấy avatar mới
        setUser((prev) =>
          prev
            ? {
                ...prev,
                avatarUrl: updated.avatarUrl || undefined,
              }
            : prev
        );

        toast.success("Cập nhật avatar thành công!");
        onSuccess && onSuccess(res.data as any);
      } catch (err) {
        console.error("Lỗi upload avatar:", err);
        toast.error("Upload avatar thất bại.");
        onError && onError(err as any);
      } finally {
        setAvatarLoading(false);
      }
    },
  };

  // Xoá thật sự (call API) – dùng nội bộ
  const removeAvatar = async () => {
    try {
      if (!userId) {
        toast.error("Chưa đăng nhập.");
        return;
      }

      setAvatarLoading(true);
      const res = await axios.delete(`${API_BASE}/profile/${userId}/avatar`);
      const updated: Profile = res.data.data || res.data;
      setProfile(updated);

      // Cập nhật lại user trong context
      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: updated.avatarUrl || undefined, // thường là null
            }
          : prev
      );

      toast.success("Đã xoá avatar.");
    } catch (err) {
      console.error("Lỗi xóa avatar:", err);
      toast.error("Không xoá được avatar.");
    } finally {
      setAvatarLoading(false);
    }
  };


const handleRemoveAvatar = async () => {
    try {
      if (!userId) {
        toast.error("Chưa đăng nhập.");
        return;
      }

      setAvatarLoading(true); // 👈 xoá cũng có loading
      const res = await axios.delete(`${API_BASE}/profile/${userId}/avatar`);
      const updated: Profile = res.data.data || res.data;
      setProfile(updated);
      toast.success("Đã xoá avatar.");
    } catch (err) {
      console.error("Lỗi xóa avatar:", err);
      toast.error("Không xoá được avatar.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const onSaveProfile = async (values: any) => {
    try {
      if (!userId) {
        toast.error("Chưa đăng nhập.");
        return;
      }

      setSaving(true);
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.toISOString()
          : null,
      };

      const res = await axios.put(`${API_BASE}/profile/${userId}`, payload);
      const updated: Profile = res.data.data || res.data;
      setProfile(updated);

      // Đồng bộ lại AuthContext để header dùng tên + email mới
      setUser((prev) =>
        prev
          ? {
              ...prev,
              fullName: updated.fullName,
              email: updated.email,
              avatarUrl: updated.avatarUrl || prev.avatarUrl,
            }
          : prev
      );

      toast.success("Đã lưu thông tin.");
    } catch (err: any) {
      console.error("Lỗi lưu profile:", err);
      toast.error(
        err?.response?.data?.message || "Không lưu được thông tin."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <Row gutter={24}>
        {/* Cột trái: Avatar + info chung */}
        <Col xs={24} md={8} lg={7}>
          <Card loading={loading}>
            <Space
              direction="vertical"
              style={{ width: "100%" }}
              align="center"
            >
              {/* Vòng tròn loading bao quanh avatar */}
              <Spin spinning={avatarLoading}>
                {profile && (
                  <Badge.Ribbon
                    text={profile.role.toLowerCase()}
                    color={roleColor[profile.role]}
                  >
                    <Avatar
                      size={128}
                      src={profile.avatarUrl || undefined}
                      icon={<UserOutlined />}
                      style={{ border: "2px solid #fff" }}
                    />
                  </Badge.Ribbon>
                )}
              </Spin>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {profile?.fullName}
                </div>
                <div style={{ opacity: 0.7 }}>
                  {profile?.code && <span>{profile.code} • </span>}
                  {profile?.email}
                </div>
              </div>

              {/* Nút đổi / xoá avatar – thiết kế gọn hơn */}
              <Space>
                <Upload {...uploadProps}>
                  <Button
                    icon={<UploadOutlined />}
                    type="default"
                    shape="round"
                    disabled={avatarLoading}
                  >
                    Đổi avatar
                  </Button>
                </Upload>

                {profile?.avatarUrl && (
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveAvatar}
                    disabled={avatarLoading}
                    style={{ paddingInline: 8 }}
                  >
                    Xoá avatar
                  </Button>
                )}
              </Space>

              <Descriptions
  column={1}
  size="small"
  style={{ marginTop: 16, width: "100%" }}
>
  {profile && profile.role.toLowerCase() === "student" && profile.student && (
    <>
      <Descriptions.Item label="Mã SV">
        {profile.student.studentCode}
      </Descriptions.Item>
      <Descriptions.Item label="Lớp">
        {profile.student.className || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Ngành">
        {profile.student.major || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Niên khóa">
        {profile.student.academicYear || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Lần đăng nhập gần nhất">
          {dayjs(profile.lastLogin).format("DD/MM/YYYY HH:mm") || "—"}
        </Descriptions.Item>
    </>
  )}

  {profile && profile.role.toLowerCase() === "teacher" && profile.teacher && (
    <>
      <Descriptions.Item label="Mã GV">
        {profile.teacher.teacherCode}
      </Descriptions.Item>
      <Descriptions.Item label="Khoa/Bộ môn">
        {profile.teacher.department || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Chức vụ">
        {profile.teacher.position || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Chuyên môn">
        {profile.teacher.specialization || "—"}
      </Descriptions.Item>
      <Descriptions.Item label="Lần đăng nhập gần nhất">
          {dayjs(profile.lastLogin).format("DD/MM/YYYY HH:mm") || "—"}
        </Descriptions.Item>
    </>
  )}

  {profile && profile.role.toLowerCase() === "admin" && (
    <>
      <Descriptions.Item label="Quyền hệ thống">
        {profile.role}
      </Descriptions.Item>
      
        <Descriptions.Item label="Lần đăng nhập gần nhất">
          {dayjs(profile.lastLogin).format("DD/MM/YYYY HH:mm") || "—"}
        </Descriptions.Item>
      
    </>
  )}
</Descriptions>

            </Space>
          </Card>
        </Col>

        {/* Cột phải: form sửa thông tin */}
        <Col xs={24} md={16} lg={17}>
          <Card>
            <Tabs
              defaultActiveKey="info"
              items={[
                {
                  key: "info",
                  label: "Thông tin cá nhân",
                  children: (
                    <Form
                      layout="vertical"
                      form={form}
                      onFinish={onSaveProfile}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            rules={[
                              {
                                required: true,
                                message: "Vui lòng nhập họ và tên",
                              },
                              {
                                validator: (_, value) => {
                                  const trimmed = (value || "").trim();
                                  if (!trimmed) {
                                    return Promise.reject(
                                      "Họ và tên không được chỉ chứa khoảng trắng"
                                    );
                                  }
                                  if (trimmed.length < 3) {
                                    return Promise.reject(
                                      "Họ và tên phải có ít nhất 3 ký tự"
                                    );
                                  }
                                  const nameRegex =
                                    /^[A-Za-zÀ-ỹỲỴÝỶỸà-ỹđĐ\s'.-]+$/;
                                  if (!nameRegex.test(trimmed)) {
                                    return Promise.reject(
                                      "Họ và tên chỉ được chứa chữ cái và dấu cách"
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <Input
                              placeholder="Nguyễn Văn A"
                              maxLength={120}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="phone"
                            label="Số điện thoại"
                            rules={[
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve();
                                  const trimmed = value.replace(/\s+/g, "");
                                  const phoneRegex =
                                    /^(0[0-9]{9}|(\+84)[0-9]{9,10})$/;
                                  if (!phoneRegex.test(trimmed)) {
                                    return Promise.reject(
                                      "Số điện thoại không hợp lệ (vd: 0912345678 hoặc +84912345678)"
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <Input placeholder="0912 345 678" maxLength={15} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="dateOfBirth"
                            label="Ngày sinh"
                            rules={[
                              {
                                validator: (_, value) => {
                                  if (!value) return Promise.resolve();
                                  if (value.isAfter(dayjs(), "day")) {
                                    return Promise.reject(
                                      "Ngày sinh không được lớn hơn ngày hiện tại"
                                    );
                                  }
                                  if (
                                    value.isBefore(
                                      dayjs().subtract(100, "year"),
                                      "day"
                                    )
                                  ) {
                                    return Promise.reject(
                                      "Ngày sinh không hợp lệ (quá 100 tuổi)"
                                    );
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY"
                              disabledDate={disabledDate}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={12}>
                          <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[
                              {
                                max: 200,
                                message: "Địa chỉ tối đa 200 ký tự",
                              },
                            ]}
                          >
                            <Input placeholder="Địa chỉ" maxLength={200} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                              {
                                type: "email",
                                message: "Email không hợp lệ",
                              },
                              {
                                max: 100,
                                message: "Email tối đa 100 ký tự",
                              },
                            ]}
                          >
                            <Input
                              placeholder="example@domain.com"
                              maxLength={100}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        style={{ textAlign: "right", marginTop: 16 }}
                      >
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          size="large"
                          loading={saving}
                        >
                          Lưu thay đổi
                        </Button>
                      </Form.Item>
                    </Form>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
