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
  InputNumber,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Book } from "lucide-react";

const { Title } = Typography;
const API_BASE = "http://localhost:4000/api/v1";

type Subject = {
  id: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function Subjects() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [keyword, setKeyword] = useState("");

  // modal thêm/sửa
  const [form] = Form.useForm<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      setLoading(true);
      const res = await axios.get<{ success: boolean; data: Subject[] }>(
        `${API_BASE}/subjects`
      );
      if (res.data.success) {
        setSubjects(res.data.data || []);
      }
    } catch (err) {
      toast.error("Không tải được danh sách môn học");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/subjects/${id}`);
      toast.success("Đã xóa môn học");
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error("Không thể xóa môn học");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        subjectCode: values.subjectCode.trim().toUpperCase(),
        subjectName: values.subjectName.trim(),
        credits: values.credits,
      };

      if (editing) {
        await axios.patch(`${API_BASE}/subjects/${editing.id}`, payload);
        toast.success("Đã cập nhật môn học");
      } else {
        await axios.post(`${API_BASE}/subjects`, payload);
        toast.success("Đã thêm môn học mới");
      }

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchSubjects();
    } catch (err: any) {
      if (err?.errorFields) return;
      const errorMsg = err?.response?.data?.message || "Không thể lưu môn học";
      toast.error(errorMsg);
    }
  };

  const columns = [
    {
      title: "Mã môn học",
      dataIndex: "subjectCode",
      key: "subjectCode",
      width: "20%",
      sorter: (a: Subject, b: Subject) =>
        a.subjectCode.localeCompare(b.subjectCode),
      render: (text: string) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Tên môn học",
      dataIndex: "subjectName",
      key: "subjectName",
      width: "40%",
      sorter: (a: Subject, b: Subject) =>
        a.subjectName.localeCompare(b.subjectName),
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Số tín chỉ",
      dataIndex: "credits",
      key: "credits",
      align: "center" as const,
      width: "15%",
      sorter: (a: Subject, b: Subject) => a.credits - b.credits,
      render: (credits: number) => (
        <Tag color="green" style={{ fontSize: 14 }}>
          {credits} TC
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: "15%",
      sorter: (a: Subject, b: Subject) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime(),
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      width: "10%",
      render: (_: any, record: Subject) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Tooltip title="Sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({
                  subjectCode: record.subjectCode,
                  subjectName: record.subjectName,
                  credits: record.credits,
                });
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa môn học"
              description="Bạn có chắc muốn xóa môn học này?"
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

  const filteredSubjects = subjects.filter((s) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      s.subjectCode?.toLowerCase().includes(kw) ||
      s.subjectName?.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="pl-3 pr-3">
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Title level={3} className="mt-2">
          <div className="flex justify-center items-center gap-2">
            <div className=""><Book /></div> Quản lý Môn học
          </div>
        </Title>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo mã môn học, tên môn học..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 400 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchSubjects}>
            Làm mới
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
            Thêm môn học
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" tip="Đang tải danh sách môn học..." />
        </div>
      ) : (
        <Table<Subject>
          dataSource={filteredSubjects}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} môn học`,
          }}
          locale={{ emptyText: "Không có môn học nào" }}
        />
      )}

      {/* Modal thêm/sửa */}
      <Modal
        title={editing ? "Sửa thông tin môn học" : "Thêm môn học mới"}
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
        bodyStyle={{
          maxHeight: "70vh", // Giới hạn chiều cao modal
          overflowY: "auto", // Thêm scroll dọc
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Mã môn học"
            name="subjectCode"
            rules={[
              { required: true, message: "Vui lòng nhập mã môn học" },
              {
                pattern: /^[A-Z0-9]+$/i,
                message: "Mã môn học chỉ chứa chữ cái và số",
              },
            ]}
          >
            <Input
              placeholder="VD: IT100"
              maxLength={20}
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            label="Tên môn học"
            name="subjectName"
            rules={[{ required: true, message: "Vui lòng nhập tên môn học" }]}
          >
            <Input placeholder="VD: Cơ sở dữ liệu" maxLength={200} />
          </Form.Item>

          <Form.Item
            label="Số tín chỉ"
            name="credits"
            rules={[{ required: true, message: "Vui lòng nhập số tín chỉ" }]}
            initialValue={3}
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: "100%" }}
              placeholder="Nhập số tín chỉ"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}