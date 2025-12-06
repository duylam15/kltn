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
  Space,  // ✅ Thêm Space
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
import { Users } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title } = Typography;

type User = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
};

type Student = {
  id: number;
  userId: number;
  studentCode: string;
  className?: string;
  major?: string;
  enrollmentYear?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
};

export default function StudentsAdmin() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [keyword, setKeyword] = useState("");

  // modal thêm/sửa
  const [form] = Form.useForm<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchUsers();
  }, []);

  async function fetchStudents() {
    try {
      setLoading(true);
      const res = await instance.get<{ success: boolean; data: Student[] }>(
        `/students`
      );
      console.log(res);
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      toast.error("Không tải được danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await instance.get<{ success: boolean; data: User[] }>(
        `/users?role=student`
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
      await instance.delete(`/students/${id}`);
      toast.success("Đã xóa sinh viên");
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error("Không thể xóa sinh viên");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        studentCode: values.studentCode.trim(),
        password: "123456",
        fullName: values.fullName,
        email: values.email,
        className: values.className?.trim() || null,
        major: values.major?.trim() || null,
        academicYear: values.academicYear || null,
        enrollmentYear: values.enrollmentYear || null,
      };

      if (editing) {
        await instance.patch(`/students/${editing.id}`, payload);
        toast.success("Đã cập nhật sinh viên");
      } else {
        await instance.post(`/students`, payload);
        toast.success("Đã thêm sinh viên mới");
      }

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchStudents();
    } catch (err: any) {
      if (err?.errorFields) return;
      const errorMsg = err?.response?.data?.message || "Không thể lưu sinh viên";
      toast.error(errorMsg);
    }
  };

  const columns = [
    {
      title: "MSSV",
      dataIndex: "studentCode",
      key: "studentCode",
      width: 120,  // ✅ Thêm width
      sorter: (a: Student, b: Student) =>
        a.studentCode.localeCompare(b.studentCode),
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Họ tên",
      key: "fullName",
      width: 180,  // ✅ Thêm width
      sorter: (a: Student, b: Student) =>
        (a.user?.fullName || "").localeCompare(b.user?.fullName || ""),
      render: (_: any, record: Student) => record.user?.fullName || "—",
    },
    {
      title: "Email",
      key: "email",
      width: 220,  // ✅ Thêm width
      render: (_: any, record: Student) => record.user?.email || "—",
    },
    {
      title: "Lớp",
      dataIndex: "className",
      key: "className",
      width: 120,  // ✅ Thêm width
      sorter: (a: Student, b: Student) =>
        (a.className || "").localeCompare(b.className || ""),
      render: (text: string) => text || <Tag color="default">Chưa có</Tag>,
    },
    {
      title: "Ngành",
      dataIndex: "major",
      key: "major",
      width: 180,  // ✅ Thêm width
      sorter: (a: Student, b: Student) =>
        (a.major || "").localeCompare(b.major || ""),
      render: (text: string) => text || <Tag color="default">Chưa có</Tag>,
    },
    {
      title: "Năm nhập học",
      dataIndex: "enrollmentYear",
      key: "enrollmentYear",
      align: "center" as const,
      width: 120,  // ✅ Thêm width
      sorter: (a: Student, b: Student) =>
        (a.enrollmentYear || 0) - (b.enrollmentYear || 0),
      render: (year: number) => year || "—",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,  // ✅ Thêm width
      sorter: (a: Student, b: Student) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      width: 120,  // ✅ Thêm width
      fixed: "right" as const,  // ✅ Thêm fixed
      render: (_: any, record: Student) => (
        <Space size="small">  {/* ✅ Đổi từ div sang Space */}
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  userId: record.userId,
                  studentCode: record.studentCode,
                  fullName: record.user?.fullName,  // ✅ Thêm
                  email: record.user?.email,        // ✅ Thêm
                  className: record.className,
                  major: record.major,
                  enrollmentYear: record.enrollmentYear,
                });
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa sinh viên"
              description="Bạn có chắc muốn xóa sinh viên này?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredStudents = students.filter((s) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      s.studentCode?.toLowerCase().includes(kw) ||
      s.user?.fullName?.toLowerCase().includes(kw) ||
      s.user?.email?.toLowerCase().includes(kw) ||
      s.className?.toLowerCase().includes(kw) ||
      s.major?.toLowerCase().includes(kw)
    );
  });

  // Lọc users chưa có profile student
  const availableUsers = users.filter(
    (u) =>
      !students.some((s) => s.userId === u.id) ||
      (editing && u.id === editing.userId)
  );

  return (
    <div className="sm:px-3 h-auto sm:h-auto">  {/* ✅ Đổi từ 1800px sang 1100px */}
      {/* 🎯 RESPONSIVE HEADER */}
      <Flex
        wrap="wrap"
        gap={12}
        className="flex-col sm:flex-row items-start sm:items-center w-full pt-3 pb-5"
      >
        {/* Title Left */}
        <Title level={3} style={{ margin: 0 }}>
          <Flex align="center" gap={8}>
            <Users />
            <span>Quản lý Sinh viên</span>
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
            placeholder="Tìm theo MSSV, tên, email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full sm:w-80"
          />

          {/* Buttons */}
          <Flex gap={8} wrap="wrap">
            <Button icon={<ReloadOutlined />} onClick={fetchStudents}>
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
              <span className="hidden sm:inline">Thêm sinh viên</span>
              <span className="inline sm:hidden">Thêm</span>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" tip="Đang tải danh sách sinh viên..." />
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>  {/* ✅ Thêm wrapper div */}
          <Table<Student>
            dataSource={filteredStudents}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} sinh viên`,
              pageSizeOptions: ["10", "20", "50"],  // ✅ Thêm
              position: ["bottomRight"],            // ✅ Thêm
              style: { marginTop: 16 },             // ✅ Thêm
            }}
            locale={{ emptyText: "Không có sinh viên nào" }}
            scroll={{ x: 1200 }}
          />
        </div>
      )}

      {/* Modal thêm/sửa */}
      <Modal
        title={editing ? "Sửa thông tin sinh viên" : "Thêm sinh viên mới"}
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
            label="Mã số sinh viên (MSSV)"
            name="studentCode"
            rules={[{ required: true, message: "Vui lòng nhập MSSV" }]}
          >
            <Input placeholder="VD: 2021600001" maxLength={20} />
          </Form.Item>

          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="VD: Nguyễn Văn A" maxLength={100} />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input placeholder="VD: sinhvien@example.com" maxLength={100} />
          </Form.Item>

          <Form.Item label="Lớp" name="className">
            <Input placeholder="VD: CNTT-K15" maxLength={50} />
          </Form.Item>

          <Form.Item label="Ngành học" name="major">
            <Input placeholder="VD: Công nghệ thông tin" maxLength={100} />
          </Form.Item>

          <Form.Item label="Niên khóa" name="academicYear">
            <Input placeholder="VD: 2022-2026" maxLength={20} />
          </Form.Item>

          <Form.Item label="Năm nhập học" name="enrollmentYear">
            <Select
              placeholder="Chọn năm nhập học"
              allowClear
              options={Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: year, label: year };
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}