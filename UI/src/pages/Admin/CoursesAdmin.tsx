import { useEffect, useState } from "react";
import {
  Card,
  Spin,
  Typography,
  Row,
  Col,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Layers } from "lucide-react";
import instance from "../../utils/axiosInstance";

const { Title, Text } = Typography;
const { Option } = Select;

type Term = {
  id: number;
  code: string;
  name: string;
};

type Subject = {
  id: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
};

type Section = {
  id: number;
  sectionCode: string;
  sectionName: string;
  maxStudents: number;
  currentStudents: number;
  status: string;
  subject: Subject;
  term: Term;
  instructors: {
    teacher: {
      id: number;
      user: {
        fullName: string;
        email: string;
      } | null;
    } | null;
  }[];
};


export default function CoursesAdmin() {
  const [data, setData] = useState<Section[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<number | null>(null);

  // Fetch APIs
  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await instance.get("/course-sections");
      if (res.data.success) setData(res.data.data);
      console.log(data);
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await instance.get("/terms");
      if (res.data.success) setTerms(res.data.data);
    } catch (err) {
      console.error("Lỗi khi gọi terms:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await instance.get("/subjects");
      if (res.data.success) setSubjects(res.data.data);
    } catch (err) {
      console.error("Lỗi khi gọi subjects:", err);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchTerms();
    fetchSubjects();
  }, []);

  // Thêm nhanh lớp học phần
  const handleQuickAdd = async (
    subjectId: number,
    termId: number,
    subjectCode: string,
    sections: Section[]
  ) => {
    try {
      const nextIndex = sections.length + 1;
      const payload = {
        subjectId,
        termId,
        sectionCode: `${subjectCode}-${nextIndex}`, // VD: IT100-3
        sectionName: `Nhóm ${nextIndex}`,
        maxStudents: 50,
        status: "planned",
      };

      const res = await instance.post("/course-sections", payload);
      if (res.data.success) {
        message.success(`Đã thêm ${payload.sectionName}`);
        fetchSections();
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm nhanh:", err);
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  // Hàm cập nhật toàn bộ status trong 1 nhóm
  const handleUpdateGroupStatus = async (sections: Section[], newStatus: string) => {
    try {
      await Promise.all(
        sections.map((s) =>
          instance.patch(`/course-sections/${s.id}`, {
            status: newStatus,
          })
        )
      );
      message.success(`Đã cập nhật tất cả nhóm thành "${newStatus}"`);
      fetchSections(); // reload lại danh sách
    } catch (err: any) {
      console.error("Lỗi khi cập nhật nhóm:", err);
      message.error("Cập nhật thất bại!");
    }
  };


  // Modal thêm thủ công
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        subjectId: values.subjectId,
        termId: values.termId,
        sectionCode: values.sectionCode || " ",
        sectionName: values.sectionName,
        maxStudents: values.maxStudents || 50,
        status: values.status || "planned",
      };

      const res = await instance.post("/course-sections", payload);
      if (res.data.success) {
        message.success("Thêm học phần thành công!");
        setModalVisible(false);
        form.resetFields();
        fetchSections();
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm học phần:", err);
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  if (loading) return <Spin tip="Đang tải..." />;
  if (!data.length) return <p>Không tìm thấy dữ liệu</p>;

  // Lọc dữ liệu theo keyword, status, term
  // eslint-disable-next-line prefer-const
  let filteredData = data.filter((section) => {
    const lowerQ = keyword.toLowerCase();

    const matchKeyword =
      keyword === "" ||
      section.sectionName?.toLowerCase().includes(lowerQ) ||
      section.sectionCode?.toLowerCase().includes(lowerQ) ||
      section.subject.subjectName?.toLowerCase().includes(lowerQ) ||
      section.subject.subjectCode?.toLowerCase().includes(lowerQ) ||
      // ✅ tìm theo tên giảng viên
      section.instructors?.some((inst) =>
        inst.teacher?.user?.fullName?.toLowerCase().includes(lowerQ)
      );

    // Ẩn completed mặc định, chỉ hiển thị khi lọc theo completed
    const matchStatus =
      (!statusFilter && section.status !== "completed") ||
      (statusFilter && section.status === statusFilter);

    const matchTerm = !termFilter || section.term.id === termFilter;

    return matchKeyword && matchStatus && matchTerm;
  });


  // Gom nhóm theo môn học + học kỳ
  const grouped = filteredData.reduce((acc: any, section: Section) => {
    const key = `${section.subject.id}-${section.term.id}`;
    if (!acc[key]) {
      acc[key] = {
        subjectId: section.subject.id,
        termId: section.term.id,
        subjectCode: section.subject.subjectCode,
        subjectName: section.subject.subjectName,
        termName: section.term.name,
        sections: [],
      };
    }
    acc[key].sections.push(section);
    return acc;
  }, {});

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
            <Layers /> Quản lý học phần
          </div>
        </Title>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 150 }}
          />

          <Select
            allowClear
            placeholder="Lọc theo trạng thái"
            style={{ width: 150 }}
            value={statusFilter ?? undefined}
            onChange={(value) => setStatusFilter(value)}
          >
            <Option value="planned">Planned</Option>
            <Option value="ongoing">Ongoing</Option>
            <Option value="finished">Finished</Option>
            <Option value="completed">Completed</Option>
          </Select>

          <Select
            allowClear
            placeholder="Lọc theo học kỳ"
            style={{ width: 150 }}
            value={termFilter ?? undefined}
            onChange={(value) => setTermFilter(value)}
          >
            {terms.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name}
              </Option>
            ))}
          </Select>

          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setKeyword("");
              setStatusFilter(null);
              setTermFilter(null);
              fetchSections();
            }}
          >
            Làm mới
          </Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Thêm học phần
          </Button>
        </div>
      </div>

      {/* Danh sách nhóm */}
      {Object.values(grouped).map((subject: any, idx) => (
        <div key={idx} style={{ marginBottom: 40 }}>
          <Title
            level={4}
            style={{
              marginBottom: 16,
              padding: "8px 16px",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              {subject.subjectCode} - {subject.subjectName} ({subject.termName})
            </span>
          </Title>

          <Row gutter={[16, 16]} wrap>
            {subject.sections.map((section: Section) => (
              <Col xs={24} sm={12} md={8} lg={6} key={section.id}>
                <Card
                  style={{
                    borderRadius: 12,
                    transition: "all 0.3s",
                  }}
                  className={`bg-white rounded-xl shadow border transition hover:shadow-xl border-blue-200`}
                  bodyStyle={{ padding: 16 }}
                  onClick={() => navigate(`/admin/courses/${section.id}`)}
                >
                  <Title level={5} style={{ marginBottom: 8, color: "#1d39c4" }}>
                    {section.sectionName}
                  </Title>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text strong style={{ marginRight: 8 }}>Giảng viên:</Text>
                    <Text
                      style={{ flex: 1 }}
                      ellipsis={{ tooltip: true }} // 👈 sẽ hiện ... và hover ra tooltip
                    >
                      {section.instructors && section.instructors.length > 0
                        ? section.instructors
                          .map((inst) => inst.teacher?.user?.fullName || "Chưa có")
                          .join(", ")
                        : "Chưa có"}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text strong>Sĩ số:</Text>
                    <Text>
                      {section.currentStudents}/{section.maxStudents}
                    </Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text strong>Trạng thái:</Text>
                    <Tag
                      color={
                        section.status === "ongoing"
                          ? "green"
                          : section.status === "planned"
                            ? "blue"
                            : section.status === "finished"
                              ? "volcano"
                              : "default"
                      }
                    >
                      {section.status}
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}

            {/* Card thêm nhanh */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: "2px dashed #1890ff",
                  textAlign: "center",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#1890ff",
                  background: "#fafafa",
                }}
                onClick={() =>
                  handleQuickAdd(
                    subject.subjectId,
                    subject.termId,
                    subject.subjectCode,
                    subject.sections
                  )
                }
              >
                <PlusOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div style={{ fontWeight: 500 }}>Thêm nhóm</div>
              </Card>
            </Col>
          </Row>
        </div>
      ))}

      {/* Modal thêm học phần */}
      <Modal
        title="Thêm học phần"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleAdd}
        okText="Thêm"
        cancelText="Hủy"
        centered
        bodyStyle={{
          maxHeight: "70vh", // Giới hạn chiều cao modal
          overflowY: "auto", // Thêm scroll dọc
        }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Môn học"
            name="subjectId"
            rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
          >
            <Select placeholder="Chọn môn học">
              {subjects.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.subjectCode} - {s.subjectName} ({s.credits} TC)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Học kỳ"
            name="termId"
            rules={[{ required: true, message: "Vui lòng chọn học kỳ" }]}
          >
            <Select placeholder="Chọn học kỳ">
              {terms.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.code} - {t.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mã lớp (sectionCode)"
            name="sectionCode"
            rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Tên lớp (sectionName)"
            name="sectionName"
            rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Sĩ số tối đa" name="maxStudents" initialValue={50}>
            <Input type="number" />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" initialValue="planned">
            <Select>
              <Option value="planned">Planned</Option>
              <Option value="ongoing">Ongoing</Option>
              <Option value="finished">Finished</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
