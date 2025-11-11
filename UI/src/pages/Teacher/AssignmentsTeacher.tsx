import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Spin,
  Typography,
  Tag,
  Input,
  Tooltip,
  Switch,
  Popconfirm,
  Modal,
  Form,
  DatePicker,
  Select,
  Checkbox,
  Divider,
  Row,
  Col,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

import { useAuth } from "../../context/authContext";

const { Title } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:4000/api/v1";

type Assignment = {
  id: number;
  title: string;
  description?: string;
  type: "exercise" | "quiz" | "project" | "exam";
  dueDate?: string;
  maxScore: number;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  createdBy?: number;
  originalAssignmentId?: string;
  showAnswersAfterSubmit?: boolean;
  allowLateSubmission?: boolean;
  createdAt?: string;
  updatedAt?: string;
  submissions?: Submission[];
  sectionLinks?: Array<{
    id: number;
    sectionId: number;
    assignmentId: number;
    assignedAt: string;
    isOpen: boolean;
  }>;
};

type Submission = {
  id: number;
  assignmentId: number;
  studentId: number;
  filePath?: string;
  answerText?: string;
  score?: number;
  maxScore?: number;
  autoGraded: boolean;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  startedAt: string;
  completedAt: string;
};

type Student = {
  id: number;
  userId: number;
  studentCode: string;
  className: string;
  major: string;
  academicYear?: string;
  enrollmentYear?: number;
  gpa: string;
  status: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
};

type Question = {
  id: number;
  content: string;
  type: string;
  difficulty?: string;
  points?: number;
};

export default function AssignmentTeacher() {
  const { user } = useAuth();
  const teacherId = user?.id;
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [visibility, setVisibility] = useState<Record<number, boolean>>({});
  const [keyword, setKeyword] = useState("");

  // Modal states
  const [form] = Form.useForm<any>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  // State cho câu hỏi
  const [assignedQuestionIds, setAssignedQuestionIds] = useState<number[]>([]);
  const [tempSelectedQuestionIds, setTempSelectedQuestionIds] = useState<number[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionKeyword, setQuestionKeyword] = useState("");

  // Modal xem điểm
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    fetchData();
    fetchQuestions();
    fetchStudents();
  }, [sectionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Chỉ lấy các bài tập đã được gán vào lớp
      const res = await axios.get(`${API_BASE}/assignments/sections/${sectionId}/assignments`);

      if (res.data.success) {
        const assignmentsData = res.data.data || [];
        setAssignments(assignmentsData);

        // Set visibility từ sectionLinks
        const visibilityMap: Record<number, boolean> = {};
        assignmentsData.forEach((assignment: Assignment) => {
          if (assignment.sectionLinks && assignment.sectionLinks.length > 0) {
            visibilityMap[assignment.id] = assignment.sectionLinks[0].isOpen;
          }
        });
        setVisibility(visibilityMap);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      toast.error("Không tải được dữ liệu bài tập");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get<{ success: boolean; data: any[] }>(
        `${API_BASE}/sections-enrollments/section/${sectionId}/students`
      );
      if (res.data.success) {
        setStudents(res.data.data.map((item: any) => item.student) || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách học sinh:", err);
      toast.error("Không tải được danh sách học sinh");
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await axios.get<{ success: boolean; data: Question[] }>(
        `${API_BASE}/questions`
      );
      if (res.data.success) {
        setQuestions(res.data.data || []);
      }
    } catch {
      toast.error("Không tải được danh sách câu hỏi");
    }
  };

  const fetchAssignmentWithSubmissions = async (assignmentId: number) => {
    try {
      const res = await axios.get<{ success: boolean; data: Assignment[] }>(
        `${API_BASE}/assignments/sections/${sectionId}/assignments`
      );
      if (res.data.success) {
        const assignment = res.data.data.find((a) => a.id === assignmentId);
        if (assignment) {
          setSelectedAssignment(assignment);
          setScoreModalOpen(true);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết bài tập:", err);
      toast.error("Không tải được thông tin bài tập");
    }
  };

  const handleToggleVisibility = async (assignmentId: number, checked: boolean) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/sections-assignments/sections/${sectionId}/assignments/${assignmentId}/visibility`,
        { isOpen: checked }
      );
      if (res.data.success) {
        toast.success(`Đã ${checked ? "mở" : "đóng"} bài tập`);
        setVisibility((prev) => ({ ...prev, [assignmentId]: checked }));
      } else {
        toast.error(res.data.message || "Không thể cập nhật trạng thái");
      }
    } catch (err: any) {
      console.error("Lỗi toggle visibility:", err);
      toast.error("Lỗi server khi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_BASE}/assignments/${id}`);
      toast.success("Đã xóa bài tập");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      if (visibility[id] !== undefined) {
        const { [id]: removed, ...rest } = visibility;
        setVisibility(rest);
      }
    } catch {
      toast.error("Không thể xóa bài tập");
    }
  };

  const openCreateEditModal = async (assignment?: Assignment) => {
    if (assignment) {
      setEditing(assignment);
      form.setFieldsValue({
        ...assignment,
        dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
      });

      setLoadingQuestions(true);
      try {
        const res = await axios.get<{
          success: boolean;
          data: Array<{
            assignmentId: number;
            questionId: number;
            question: Question;
          }>;
        }>(
          `${API_BASE}/assignments-questions/assignments/${assignment.id}/questions`
        );

        if (res.data.success && res.data.data) {
          const questionIds = res.data.data.map((item) => item.questionId);
          setAssignedQuestionIds(questionIds);
          setTempSelectedQuestionIds(questionIds);
        } else {
          setAssignedQuestionIds([]);
          setTempSelectedQuestionIds([]);
        }
      } catch (error) {
        console.error("Error loading assigned questions:", error);
        toast.error("Không tải được danh sách câu hỏi đã gán");
        setAssignedQuestionIds([]);
        setTempSelectedQuestionIds([]);
      } finally {
        setLoadingQuestions(false);
      }
    } else {
      setEditing(null);
      form.resetFields();
      setAssignedQuestionIds([]);
      setTempSelectedQuestionIds([]);
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const uniqueCode = uuidv4();

      const payload = {
        title: values.title.trim(),
        description: values.description?.trim(),
        type: values.type,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        maxScore: Number(values.maxScore || 100),
        passingScore: values.passingScore ? Number(values.passingScore) : null,
        timeLimit: values.timeLimit ? Number(values.timeLimit) : null,
        maxAttempts: values.maxAttempts ? Number(values.maxAttempts) : 1,
        shuffleQuestions: values.shuffleQuestions || false,
        showAnswersAfterSubmit: values.showAnswersAfterSubmit || false,
        allowLateSubmission: values.allowLateSubmission || false,
        createdBy: teacherId,
        originalAssignmentId: uniqueCode,
      };

      let assignmentId: number;

      if (editing) {
        await axios.put(`${API_BASE}/assignments/${editing.id}`, payload);
        assignmentId = editing.id;
        toast.success("Đã cập nhật bài tập");
      } else {
        const res = await axios.post(`${API_BASE}/assignments`, payload);
        assignmentId = res.data.data.id;

        // Tự động gán vào lớp khi tạo mới
        await axios.post(
          `${API_BASE}/sections-assignments/sections/${sectionId}/assignments`,
          { assignmentId }
        );

        toast.success("Đã tạo và gán bài tập vào lớp");
      }

      await saveQuestionAssignments(assignmentId);

      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setTempSelectedQuestionIds([]);
      setAssignedQuestionIds([]);
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(
        err?.response?.data?.message || "Không thể lưu thông tin bài tập"
      );
    }
  };

  const saveQuestionAssignments = async (assignmentId: number) => {
    try {
      const toAdd = tempSelectedQuestionIds.filter(
        (id) => !assignedQuestionIds.includes(id)
      );

      const toRemove = assignedQuestionIds.filter(
        (id) => !tempSelectedQuestionIds.includes(id)
      );

      const addPromises = toAdd.map((questionId) =>
        axios.post(
          `${API_BASE}/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
        )
      );

      const removePromises = toRemove.map((questionId) =>
        axios.delete(
          `${API_BASE}/assignments-questions/assignments/${assignmentId}/questions/${questionId}`
        )
      );

      await Promise.all([...addPromises, ...removePromises]);

      if (toAdd.length > 0 || toRemove.length > 0) {
        toast.success(
          `Đã cập nhật câu hỏi (thêm: ${toAdd.length}, xóa: ${toRemove.length})`
        );
      }
    } catch (error) {
      console.error("Error saving question assignments:", error);
      toast.error("Không thể cập nhật câu hỏi");
      throw error;
    }
  };

  const toggleTempQuestionSelection = (questionId: number, checked: boolean) => {
    if (checked) {
      setTempSelectedQuestionIds((prev) => [...prev, questionId]);
    } else {
      setTempSelectedQuestionIds((prev) =>
        prev.filter((id) => id !== questionId)
      );
    }
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      exercise: "blue",
      quiz: "purple",
      project: "orange",
      exam: "red",
    };
    return colors[type] || "default";
  };

  // Tạo bảng điểm cho modal
  const getScoreTableData = () => {
    if (!selectedAssignment) return [];

    return students.map((student) => {
      const submission = selectedAssignment.submissions?.find(
        (sub) => sub.studentId === student.id
      );

      return {
        key: student.id,
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        email: student.user.email,
        className: student.className,
        submittedAt: submission?.submittedAt,
        score: submission?.score,
        maxScore: selectedAssignment.maxScore,
        status: submission
          ? submission.score !== null && submission.score !== undefined
            ? "graded"
            : "submitted"
          : "not_submitted",
      };
    });
  };

  const scoreColumns = [
    {
      title: "MSSV",
      dataIndex: "studentCode",
      key: "studentCode",
      width: 120,
      fixed: "left" as const,
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
      fixed: "left" as const,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Lớp",
      dataIndex: "className",
      key: "className",
      width: 100,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center" as const,
      render: (status: string) => {
        if (status === "graded") {
          return <Tag color="success">Đã chấm</Tag>;
        } else if (status === "submitted") {
          return <Tag color="warning">Chưa chấm</Tag>;
        } else {
          return <Tag color="default">Chưa nộp</Tag>;
        }
      },
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 150,
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Điểm",
      key: "score",
      width: 120,
      align: "center" as const,
      render: (_: any, record: any) => {
        if (record.score !== null && record.score !== undefined) {
          const percent = (record.score / record.maxScore) * 100;
          let color = "default";
          if (percent >= 80) color = "success";
          else if (percent >= 50) color = "warning";
          else color = "error";

          return (
            <Tag color={color}>
              {record.score}/{record.maxScore}
            </Tag>
          );
        }
        return "-";
      },
    },
  ];

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      sorter: (a: Assignment, b: Assignment) => a.title.localeCompare(b.title),
      render: (text: string) => (
        <div style={{ fontWeight: 600, color: "#1890ff" }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {text}
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text || <Tag color="default">Không có mô tả</Tag>}
        </Tooltip>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      align: "center" as const,
      filters: [
        { text: "Exercise", value: "exercise" },
        { text: "Quiz", value: "quiz" },
        { text: "Project", value: "project" },
        { text: "Exam", value: "exam" },
      ],
      onFilter: (value: any, record: Assignment) => record.type === value,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Điểm",
      key: "scores",
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <div>
          <div>
            <Tag color="green">Tối đa: {record.maxScore}</Tag>
          </div>
          {record.passingScore && (
            <div style={{ marginTop: 4 }}>
              <Tag color="orange">Đạt: {record.passingScore}</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Hạn nộp",
      dataIndex: "dueDate",
      key: "dueDate",
      sorter: (a: Assignment, b: Assignment) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      },
      render: (date: string) =>
        date ? (
          <div>
            <div>{dayjs(date).format("DD/MM/YYYY")}</div>
            <div style={{ fontSize: 12, color: "#999" }}>
              {dayjs(date).format("HH:mm")}
            </div>
          </div>
        ) : (
          <Tag color="default">Không giới hạn</Tag>
        ),
    },
    {
      title: "Trạng thái",
      key: "visibility",
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <Switch
          checkedChildren="Hiển thị"
          unCheckedChildren="Ẩn"
          checked={visibility[record.id] || false}
          onChange={(checked) => handleToggleVisibility(record.id, checked)}
        />
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Tooltip title="Xem điểm">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => fetchAssignmentWithSubmissions(record.id)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openCreateEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xóa bài tập"
              description="Bạn có chắc muốn xóa bài tập này?"
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

  const filteredAssignments = assignments.filter((a) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      a.title.toLowerCase().includes(kw) ||
      a.description?.toLowerCase().includes(kw) ||
      a.type.toLowerCase().includes(kw)
    );
  });

  const filteredQuestions = questions.filter((q) => {
    if (!questionKeyword) return true;
    const kw = questionKeyword.toLowerCase();
    return (
      q.content.toLowerCase().includes(kw) ||
      q.type?.toLowerCase().includes(kw) ||
      q.difficulty?.toLowerCase().includes(kw)
    );
  });

  const getStatistics = () => {
    const totalAssignments = assignments.length;
    const visibleAssignments = Object.values(visibility).filter((v) => v === true).length;
    const hiddenAssignments = totalAssignments - visibleAssignments;

    const byType = assignments.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAssignments,
      visibleAssignments,
      hiddenAssignments,
      byType,
    };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          marginTop: -16,
          flexWrap: "wrap",
          gap: 12,
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
            <FileTextOutlined style={{ fontSize: 14, color: "#1890ff" }} />
            <span>Tổng bài tập:</span>
            <strong>{stats.totalAssignments}</strong>
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
            <EyeOutlined style={{ fontSize: 14, color: "#52c41a" }} />
            <span>Đang hiển thị:</span>
            <strong style={{ color: "#52c41a" }}>{stats.visibleAssignments}</strong>
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
            <UserOutlined style={{ fontSize: 14, color: "#722ed1" }} />
            <span>Học sinh:</span>
            <strong style={{ color: "#722ed1" }}>{students.length}</strong>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tiêu đề, mô tả, loại..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openCreateEditModal()}
          >
            Thêm bài tập
          </Button>
        </div>
      </div>

      <Table<Assignment>
        dataSource={filteredAssignments}
        columns={columns}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "Không có bài tập nào trong lớp này" }}
      />

      {/* Modal thêm/sửa */}
      <Modal
        title={editing ? "Sửa thông tin bài tập" : "Thêm bài tập mới"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          setTempSelectedQuestionIds([]);
          setAssignedQuestionIds([]);
          setQuestionKeyword("");
        }}
        onOk={handleSubmit}
        okText={editing ? "Lưu" : "Tạo mới"}
        cancelText="Hủy"
        width={1200}
        centered
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Title level={5} style={{ marginBottom: 12 }}>
              Thông tin bài tập
            </Title>
            <Form form={form} layout="vertical" style={{ marginBottom: 0 }}>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="VD: Bài tập OOP" />
              </Form.Item>

              <Form.Item
                label="Mô tả"
                name="description"
                style={{ marginBottom: 12 }}
              >
                <Input.TextArea rows={3} placeholder="Mô tả chi tiết bài tập" />
              </Form.Item>

              <Form.Item
                label="Loại bài tập"
                name="type"
                rules={[{ required: true, message: "Vui lòng chọn loại" }]}
                style={{ marginBottom: 12 }}
              >
                <Select placeholder="Chọn loại bài tập">
                  <Option value="exercise">Exercise</Option>
                  <Option value="quiz">Quiz</Option>
                  <Option value="project">Project</Option>
                  <Option value="exam">Exam</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Hạn nộp" name="dueDate" style={{ marginBottom: 12 }}>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Divider style={{ margin: "12px 0" }}>Cấu hình</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Điểm tối đa"
                    name="maxScore"
                    style={{ marginBottom: 12 }}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Điểm đạt"
                    name="passingScore"
                    style={{ marginBottom: 12 }}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Thời gian (phút)"
                    name="timeLimit"
                    style={{ marginBottom: 12 }}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số lần nộp"
                    name="maxAttempts"
                    style={{ marginBottom: 12 }}
                  >
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="shuffleQuestions"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Checkbox>Xáo trộn câu hỏi</Checkbox>
              </Form.Item>
              <Form.Item
                name="showAnswersAfterSubmit"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Checkbox>Hiện đáp án sau khi nộp</Checkbox>
              </Form.Item>
              <Form.Item
                name="allowLateSubmission"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Cho phép nộp muộn</Checkbox>
              </Form.Item>
            </Form>
          </Col>

          <Col span={12}>
            <Title level={5}>Câu hỏi</Title>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm câu hỏi..."
              value={questionKeyword}
              onChange={(e) => setQuestionKeyword(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                padding: 12,
              }}
            >
              {loadingQuestions ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin tip="Đang tải câu hỏi..." />
                </div>
              ) : filteredQuestions.length === 0 ? (
                <p style={{ textAlign: "center", color: "#999" }}>
                  Không có câu hỏi nào
                </p>
              ) : (
                filteredQuestions.map((q) => {
                  const checked = tempSelectedQuestionIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        marginBottom: 8,
                        borderRadius: 4,
                        border: "1px solid #d9d9d9",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        backgroundColor: checked ? "#e6f7ff" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        if (!checked)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            toggleTempQuestionSelection(q.id, e.target.checked)
                          }
                          style={{ marginTop: 4, cursor: "pointer" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>
                            {q.content}
                          </div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {q.type && <Tag color="blue">{q.type}</Tag>}
                            {q.difficulty && <Tag color="orange">{q.difficulty}</Tag>}
                            {q.points && <Tag color="green">{q.points} điểm</Tag>}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Đã chọn: {tempSelectedQuestionIds.length} câu hỏi
            </div>
          </Col>
        </Row>
      </Modal>

      {/* Modal xem điểm */}
      <Modal
        title={
          <div>
            <FileTextOutlined style={{ marginRight: 8 }} />
            {selectedAssignment?.title} - Bảng điểm
          </div>
        }
        open={scoreModalOpen}
        onCancel={() => {
          setScoreModalOpen(false);
          setSelectedAssignment(null);
        }}
        footer={[
          <Button key="close" onClick={() => setScoreModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={1200}
        centered
      >
        <Table
          dataSource={getScoreTableData()}
          columns={scoreColumns}
          rowKey="key"
          bordered
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "Không có dữ liệu" }}
        />
      </Modal>
    </div>
  );
}