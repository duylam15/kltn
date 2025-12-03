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
  Dropdown,
  Popconfirm,
  InputNumber,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { Layers } from "lucide-react";
import { useAuth } from "../../context/authContext";
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

type SubjectAssignment = {
  id: number;
  subjectId: number;
  teacherId: number;
  role: string;
  assignedAt: string;
  isActive: boolean;
  subject: Subject & {
    _count: {
      courseSections: number;
    };
  };
};

export default function Dashboard() {
  const path = window.location.pathname;
  const [data, setData] = useState<Section[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<SubjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editForm] = Form.useForm();

  // State để toggle hiển thị môn chưa có lớp
  const [showUnassignedSubjects, setShowUnassignedSubjects] = useState(false);

  // Fetch các môn học được phân công
  const fetchAssignedSubjects = async () => {
    if (!user?.teacher?.id) return;

    try {
      const res = await instance.get(
        `http://localhost:4000/api/v1/subject-instructors/teacher/${user.teacher.id}`
      );

      if (res.data.success) {
        setAssignedSubjects(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải môn học được phân công:", err);
    }
  };

  // Fetch sections của giảng viên
  const fetchSections = async () => {
    if (!user?.teacher?.id) return;

    setLoading(true);
    try {
      const res = await instance.get(
        `/sections-instructors?teacher_id=${user.teacher.id}`
      );

      if (res.data.success) {
        setData(res.data.data.map((item: any) => item.section) || []);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await instance.get("/terms");
      if (res.data.success) setTerms(res.data.data || []);
    } catch (err) {
      console.error("Lỗi khi gọi terms:", err);
    }
  };

  useEffect(() => {
    if (user?.teacher?.id) {
      fetchAssignedSubjects();
      fetchSections();
      fetchTerms();
    }
  }, [user]);

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
        sectionCode: `${subjectCode}. ${String(nextIndex).padStart(2, "0")}`,
        sectionName: `Nhóm ${nextIndex}`,
        maxStudents: 50,
        status: "planned",
      };

      const res = await instance.post(
        "/course-sections",
        payload
      );

      if (res.data.success) {
        // Tự động phân công giảng viên vào section vừa tạo
        await instance.post("/sections-instructors", {
          sectionId: res.data.data.id,
          teacherId: user?.teacher?.id,
          role: "owner",
        });

        message.success(`Đã thêm ${payload.sectionName}`);
        fetchSections();
      }
    } catch (err: any) {
      console.error("Lỗi khi thêm nhanh:", err);
      message.error(err.response?.data?.message || "Thêm thất bại!");
    }
  };

  // Modal thêm thủ công
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();

      // Kiểm tra môn học có được phân công không
      const isAssigned = assignedSubjects.some(
        (item) => item.subjectId === values.subjectId && item.isActive
      );

      if (!isAssigned) {
        message.error("Bạn chưa được phân công môn học này!");
        return;
      }

      const payload = {
        subjectId: values.subjectId,
        termId: values.termId,
        sectionCode: values.sectionCode || " ",
        sectionName: values.sectionName,
        maxStudents: values.maxStudents || 50,
        status: values.status || "planned",
      };

      const res = await instance.post(
        "/course-sections",
        payload
      );

      if (res.data.success) {
        // Tự động phân công giảng viên vào section vừa tạo
        await instance.post("/sections-instructors", {
          sectionId: res.data.data.id,
          teacherId: user?.teacher?.id,
          role: "owner",
        });

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

  // Xóa section
  const handleDelete = async (sectionId: number) => {
    try {
      await instance.delete(`/course-sections/${sectionId}`);
      message.success("Xóa học phần thành công!");
      fetchSections();
    } catch (err: any) {
      console.error("Lỗi khi xóa:", err);
      message.error(err.response?.data?.message || "Xóa thất bại!");
    }
  };

  // Thay đổi trạng thái
  const handleChangeStatus = async (sectionId: number, newStatus: string) => {
    try {
      await instance.patch(`/course-sections/${sectionId}`, {
        status: newStatus,
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchSections();
    } catch (err: any) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Mở modal edit
  const handleOpenEdit = (section: Section) => {
    setEditingSection(section);
    editForm.setFieldsValue({
      sectionCode: section.sectionCode,
      sectionName: section.sectionName,
      maxStudents: section.maxStudents,
      status: section.status,
    });
    setEditModalVisible(true);
  };

  // Xử lý edit
  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields();

      await instance.patch(
        `/course-sections/${editingSection?.id}`,
        values
      );

      message.success("Cập nhật học phần thành công!");
      setEditModalVisible(false);
      editForm.resetFields();
      setEditingSection(null);
      fetchSections();
    } catch (err: any) {
      console.error("Lỗi khi cập nhật:", err);
      message.error(err.response?.data?.message || "Cập nhật thất bại!");
    }
  };

  // Dịch trạng thái
  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      planned: "Kế hoạch",
      ongoing: "Đang học",
      finished: "Kết thúc",
      completed: "Hoàn thành",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      planned: "blue",
      ongoing: "green",
      finished: "volcano",
      completed: "default",
    };
    return colorMap[status] || "default";
  };

  if (loading) return <Spin tip="Đang tải..." fullscreen />;
  if (!data.length && assignedSubjects.length === 0)
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <p>Bạn chưa được phân công môn học nào.</p>
      </div>
    );

  // Lọc dữ liệu theo keyword, status, term
  const filteredData = data.filter((section) => {
    const lowerQ = keyword.toLowerCase();

    const matchKeyword =
      keyword === "" ||
      section.sectionName?.toLowerCase().includes(lowerQ) ||
      section.sectionCode?.toLowerCase().includes(lowerQ) ||
      section.subject.subjectName?.toLowerCase().includes(lowerQ) ||
      section.subject.subjectCode?.toLowerCase().includes(lowerQ);

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

  // Đếm số môn chưa có lớp
  const unassignedSubjectsCount = assignedSubjects.filter(
    (assignment) =>
      assignment.isActive &&
      !data.some((s) => s.subject.id === assignment.subjectId)
  ).length;

  return (
    <div className="dashboard-container" style={{ padding: "8px 12px" }}>
      <style>
        {`
          /* Mobile styles */
          @media (max-width: 768px) {
            .dashboard-header {
              flex-direction: column ! important;
              align-items: flex-start !important;
              gap: 12px !important;
            }

            .dashboard-title {
              font-size: 18px !important;
              margin-bottom: 0 !important;
            }

            .dashboard-filters {
              width: 100% !important;
              flex-direction: column !important;
              gap: 8px !important;
            }

            .dashboard-filters . ant-input,
            .dashboard-filters .ant-select,
            .dashboard-filters .ant-btn {
              width: 100% !important;
            }

            .dashboard-filters .filter-group {
              display: flex;
              gap: 8px;
              width: 100%;
            }

            .dashboard-filters .filter-group > * {
              flex: 1;
            }

            .section-title {
              font-size: 14px !important;
              padding: 8px 12px !important;
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 4px !important;
            }

            .section-card-body {
              padding: 12px !important;
            }

            .section-card-title {
              font-size: 14px !important;
            }

            .section-info-row {
              font-size: 12px !important;
            }

            .quick-add-card {
              min-height: 120px !important;
            }

            .quick-add-card . anticon {
              font-size: 24px !important;
            }

            .assigned-subject-card {
              font-size: 13px !important;
            }

            .ant-modal {
              max-width: calc(100vw - 16px) !important;
              margin: 8px !important;
            }
          }

          /* Tablet styles */
          @media (min-width: 769px) and (max-width: 1024px) {
            .dashboard-filters {
              flex-wrap: wrap !important;
            }

            .dashboard-filters . ant-input {
              width: 200px !important;
            }

            .dashboard-filters .ant-select {
              width: 180px !important;
            }
          }

          /* Smooth transitions */
          .section-card {
            transition: all 0. 3s ease !important;
          }

          .section-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          @media (max-width: 768px) {
            .section-card:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div
        className="dashboard-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3} className="dashboard-title mt-2 mb-0">
          <div className="flex items-center gap-2">
            <Layers size={20} /> Lớp học phần của tôi
          </div>
        </Title>

        <div className="dashboard-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 150 }}
          />

          <div className="filter-group">
            <Select
              allowClear
              placeholder="Trạng thái"
              style={{ width: 130 }}
              value={statusFilter ?? undefined}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value="planned">Kế hoạch</Option>
              <Option value="ongoing">Đang học</Option>
              <Option value="finished">Kết thúc</Option>
              <Option value="completed">Hoàn thành</Option>
            </Select>

            <Select
              allowClear
              placeholder="Học kỳ"
              style={{ width: 130 }}
              value={termFilter ?? undefined}
              onChange={(value) => setTermFilter(value)}
            >
              {terms.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </div>

          <div className="filter-group">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setKeyword("");
                setStatusFilter(null);
                setTermFilter(null);
                fetchSections();
              }}
            >
              <span className="btn-text">Làm mới</span>
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              <span className="btn-text">Thêm</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Nút toggle hiển thị môn chưa có lớp */}
      {unassignedSubjectsCount > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={showUnassignedSubjects ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowUnassignedSubjects(!showUnassignedSubjects)}
            type={showUnassignedSubjects ? "default" : "dashed"}
          >
            {showUnassignedSubjects ? "Ẩn" : "Hiển thị"} môn học chưa có lớp ({unassignedSubjectsCount})
          </Button>
        </div>
      )}

      {/* Hiển thị các môn được phân công nhưng chưa có section */}
      {showUnassignedSubjects && unassignedSubjectsCount > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 16, fontSize: 16 }}>
            📚 Môn học được phân công (chưa có lớp)
          </Title>
          <Row gutter={[12, 12]}>
            {assignedSubjects
              .filter(
                (assignment) =>
                  assignment.isActive &&
                  !data.some((s) => s.subject.id === assignment.subjectId)
              )
              .map((assignment) => (
                <Col xs={24} sm={12} md={8} lg={6} key={assignment.id}>
                  <Card
                    className="assigned-subject-card"
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: "2px dashed #1890ff",
                      background: "#f0f5ff",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Title level={5} style={{ color: "#1890ff", marginBottom: 8, fontSize: 14 }}>
                      {assignment.subject.subjectCode}
                    </Title>
                    <Text strong style={{ fontSize: 13 }}>
                      {assignment.subject.subjectName}
                    </Text>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      <Tag color="blue">{assignment.subject.credits} Tín chỉ</Tag>
                      <Tag color="green">
                        {assignment.role === "owner" ? "Chủ nhiệm" : assignment.role}
                      </Tag>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>
                      Nhấn "Thêm" để tạo lớp mới
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </div>
      )}

      {/* Danh sách nhóm */}
      {Object.keys(grouped).length === 0 ? (
        <Card
          style={{
            textAlign: "center",
            padding: "24px 16px",
            border: "1px solid #d9d9d9",
            borderRadius: 8,
          }}
        >
          <Text type="secondary">
            Chưa có lớp học phần nào. Hãy thêm lớp học phần mới từ các môn được phân công!
          </Text>
        </Card>
      ) : (
        Object.values(grouped).map((subject: any, idx) => (
          <div key={idx} style={{ marginBottom: 32 }}>
            <Title
              level={4}
              className="section-title"
              style={{
                marginBottom: 12,
                padding: "10px 16px",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f0f5ff",
                fontSize: 15,
                border: "1px solid #d6e4ff",
              }}
            >
              <span>
                {subject.subjectCode} - {subject.subjectName}
              </span>
              <Tag color="blue">{subject.termName}</Tag>
            </Title>

            <Row gutter={[12, 12]}>
              {subject.sections.map((section: Section) => (
                <Col xs={24} sm={12} md={8} lg={6} key={section.id}>
                  <Card
                    hoverable
                    className="section-card"
                    style={{
                      borderRadius: 12,
                      transition: "all 0.3s",
                      border: "2px solid #1890ff",
                      boxShadow: "0 2px 8px rgba(24, 144, 255, 0.1)",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                      <div
                        style={{ flex: 1, cursor: "pointer" }}
                        onClick={() => navigate(`/teacher/courses/${section.id}`)}
                      >
                        <Title
                          level={5}
                          className="section-card-title"
                          style={{ marginBottom: 8, color: "#1d39c4", fontSize: 15 }}
                        >
                          {section.sectionName}
                        </Title>
                        <div
                          className="section-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: 13,
                          }}
                        >
                          <Text strong>Mã lớp:</Text>
                          <Text>{section.sectionCode}</Text>
                        </div>
                        <div
                          className="section-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 6,
                            fontSize: 13,
                          }}
                        >
                          <Text strong>Sĩ số:</Text>
                          <Text>
                            {section.currentStudents}/{section.maxStudents}
                          </Text>
                        </div>
                        <div
                          className="section-info-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                          }}
                        >
                          <Text strong>Trạng thái:</Text>
                          <Tag color={getStatusColor(section.status)}>
                            {getStatusLabel(section.status)}
                          </Tag>
                        </div>
                      </div>

                      {/* Icon cài đặt */}
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: "edit",
                              icon: <EditOutlined />,
                              label: "Chỉnh sửa",
                              onClick: () => handleOpenEdit(section),
                            },
                            {
                              key: "status",
                              label: "Thay đổi trạng thái",
                              children: [
                                {
                                  key: "planned",
                                  label: "Kế hoạch",
                                  onClick: () => handleChangeStatus(section.id, "planned"),
                                },
                                {
                                  key: "ongoing",
                                  label: "Đang học",
                                  onClick: () => handleChangeStatus(section.id, "ongoing"),
                                },
                                {
                                  key: "finished",
                                  label: "Kết thúc",
                                  onClick: () => handleChangeStatus(section.id, "finished"),
                                },
                                {
                                  key: "completed",
                                  label: "Hoàn thành",
                                  onClick: () => handleChangeStatus(section.id, "completed"),
                                },
                              ],
                            },
                            {
                              type: "divider",
                            },
                            {
                              key: "delete",
                              icon: <DeleteOutlined />,
                              onClick: () => handleDelete(section.id),
                              label: (
                                <span>Xóa</span>
                              ),
                              danger: true,
                            },
                          ],
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          icon={<SettingOutlined />}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </Dropdown>
                    </div>
                  </Card>
                </Col>
              ))}

              {/* Card thêm nhanh */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  className="quick-add-card"
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
                    minHeight: 150,
                  }}
                  bodyStyle={{ width: "100%", padding: 16 }}
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
        ))
      )}

      {/* Modal thêm học phần */}
      <Modal
        title="Thêm học phần"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleAdd}
        okText="Thêm"
        cancelText="Hủy"
        centered
        style={{ maxWidth: "calc(100vw - 16px)" }}
        bodyStyle={{
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Môn học"
            name="subjectId"
            rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
          >
            <Select
              placeholder="Chọn môn học được phân công"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {assignedSubjects
                .filter((item) => item.isActive)
                .map((item) => (
                  <Option key={item.subjectId} value={item.subjectId}>
                    {item.subject.subjectCode} - {item.subject.subjectName} (
                    {item.subject.credits} TC)
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
            label="Mã lớp"
            name="sectionCode"
            rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
          >
            <Input placeholder="VD: IT100. 01" />
          </Form.Item>

          <Form.Item
            label="Tên lớp"
            name="sectionName"
            rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
          >
            <Input placeholder="VD: Nhóm 1" />
          </Form.Item>

          <Form.Item label="Sĩ số tối đa" name="maxStudents" initialValue={50}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status" initialValue="planned">
            <Select>
              <Option value="planned">Kế hoạch</Option>
              <Option value="ongoing">Đang học</Option>
              <Option value="finished">Kết thúc</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa học phần */}
      <Modal
        title="Chỉnh sửa học phần"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setEditingSection(null);
        }}
        onOk={handleEdit}
        okText="Cập nhật"
        cancelText="Hủy"
        centered
        style={{ maxWidth: "calc(100vw - 16px)" }}
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item
            label="Mã lớp"
            name="sectionCode"
            rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
          >
            <Input placeholder="VD: IT100.01" />
          </Form.Item>

          <Form.Item
            label="Tên lớp"
            name="sectionName"
            rules={[{ required: true, message: "Vui lòng nhập tên lớp" }]}
          >
            <Input placeholder="VD: Nhóm 1" />
          </Form.Item>

          <Form.Item label="Sĩ số tối đa" name="maxStudents">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Trạng thái" name="status">
            <Select>
              <Option value="planned">Kế hoạch</Option>
              <Option value="ongoing">Đang học</Option>
              <Option value="finished">Kết thúc</Option>
              <Option value="completed">Hoàn thành</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}