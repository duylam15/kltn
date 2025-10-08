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
  CloudUploadOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { FileQuestion } from "lucide-react";
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
  createdBy?: number;              // ← THÊM
  originalAssignmentId?: number;   // ← THÊM
  showAnswersAfterSubmit?: boolean;
  allowLateSubmission?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Question = {
  id: number;
  content: string;
  type: string;
  difficulty?: string;
  points?: number;
};

export default function AssignmentTeacher() {
  const { user } = useAuth(); // ✅ thêm dòng này
  const teacherId = user?.id; // ID của giáo viên hiện tại
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignedIds, setAssignedIds] = useState<Record<number, boolean>>({});
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

  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>([]);
  const [libraryKeyword, setLibraryKeyword] = useState("");

  useEffect(() => {
    fetchData();
    fetchQuestions();
  }, [sectionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        axios.get(`${API_BASE}/assignments/teacher/${teacherId}`),
        axios.get(`${API_BASE}/sections-assignments/sections/${sectionId}/assignments`),
      ]);

      if (res1.data.success) {
        setAssignments(res1.data.data || []);
      }

      console.log(assignments);

      if (res2.data.success) {
        const assignedMap: Record<number, boolean> = {};
        const visibilityMap: Record<number, boolean> = {};
        res2.data.data.forEach((item: any) => {
          assignedMap[item.assignmentId] = true;
          visibilityMap[item.assignmentId] = item.isOpen;
        });
        setAssignedIds(assignedMap);
        setVisibility(visibilityMap);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
      toast.error("Không tải được dữ liệu bài tập");
    } finally {
      setLoading(false);
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

  const handleAssign = async (assignmentId: number) => {
    try {
      const res = await axios.post(
        `${API_BASE}/sections-assignments/sections/${sectionId}/assignments`,
        { assignmentId }
      );
      if (res.data.success) {
        toast.success("Đã gán bài tập vào lớp");
        setAssignedIds((prev) => ({ ...prev, [assignmentId]: true }));
        setVisibility((prev) => ({ ...prev, [assignmentId]: true }));
      } else {
        if (res.data.message === "Bài tập này đã được gán vào lớp rồi") {
          toast.success("Bài tập đã được gán vào lớp");
          fetchData();
        } else {
          toast.error(res.data.message || "Không thể gán bài tập");
        }
      }
    } catch (err: any) {
      console.error("Lỗi assign:", err);
      if (
        err.response?.status === 400 &&
        err.response?.data?.message === "Bài tập này đã được gán vào lớp rồi"
      ) {
        toast.success("Bài tập đã được gán vào lớp");
        fetchData();
      } else {
        toast.error("Lỗi server khi gán bài tập");
      }
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
      // Remove from assigned if exists
      if (assignedIds[id]) {
        const { [id]: removed, ...rest } = assignedIds;
        setAssignedIds(rest);
      }
      if (visibility[id] !== undefined) {
        const { [id]: removed, ...rest } = visibility;
        setVisibility(rest);
      }
    } catch {
      toast.error("Không thể xóa bài tập");
    }
  };

  // Mở modal tạo/sửa và load câu hỏi đã gán
  const openCreateEditModal = async (assignment?: Assignment) => {
    if (assignment) {
      setEditing(assignment);
      form.setFieldsValue({
        ...assignment,
        dueDate: assignment.dueDate ? dayjs(assignment.dueDate) : null,
      });

      // Load câu hỏi đã gán từ API
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
      const uniqueCode = uuidv4(); // 👈 mã ngẫu nhiên

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
        createdBy: teacherId, // hoặc lấy từ context, token decode
        originalAssignmentId: uniqueCode
        // Không gửi originalAssignmentId khi tạo mới
      };

      let assignmentId: number;

      if (editing) {
        await axios.put(`${API_BASE}/assignments/${editing.id}`, payload);
        assignmentId = editing.id;
        toast.success("Đã cập nhật bài tập");
      } else {
        const res = await axios.post(`${API_BASE}/assignments`, payload);
        assignmentId = res.data.data.id;
        toast.success("Đã tạo bài tập mới");
      }

      // Gán câu hỏi
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

  // Lưu gán câu hỏi
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

  // Toggle checkbox câu hỏi
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
      title: "Trạng thái lớp",
      key: "classStatus",
      align: "center" as const,
      render: (_: any, record: Assignment) =>
        assignedIds[record.id] ? (
          <Switch
            checkedChildren="Hiển thị"
            unCheckedChildren="Ẩn"
            checked={visibility[record.id] || false}
            onChange={(checked) => handleToggleVisibility(record.id, checked)}
          />
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<CloudUploadOutlined />}
            onClick={() => handleAssign(record.id)}
          >
            Gán vào lớp
          </Button>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
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

  const fetchAllAssignments = async () => {
    try {
      setLoadingLibrary(true);

      const [allRes, myRes] = await Promise.all([
        axios.get(`${API_BASE}/assignments`),
        axios.get(`${API_BASE}/assignments/teacher/${teacherId}`),
      ]);

      if (allRes.data.success && myRes.data.success) {
        const allAsgs = allRes.data.data;
        const myAsgs = myRes.data.data;

        // Lấy Set chứa originalAssignmentId của các bài tập tôi đã copy
        const myOriginalAssignmentIds = new Set(
          myAsgs
            .filter((a: Assignment) => a.originalAssignmentId)
            .map((a: Assignment) => a.originalAssignmentId)
        );

        // Bước 1: Lọc bỏ bài tập của chính mình (không phải copy)
        const otherAssignments = allAsgs.filter((a: Assignment) => {
          return !(a.createdBy === teacherId && !a.originalAssignmentId);
        });

        // Bước 2: Nhóm theo rootId, chỉ lấy 1 đại diện
        const assignmentsByRootId = new Map<number, Assignment>();

        otherAssignments.forEach((a: Assignment) => {
          const rootId = a.originalAssignmentId || a.id;

          // Ưu tiên bản gốc
          if (!assignmentsByRootId.has(rootId) || !a.originalAssignmentId) {
            assignmentsByRootId.set(rootId, a);
          }
        });

        // Bước 3: Lọc bỏ những rootId đã copy
        const availableAssignments = Array.from(assignmentsByRootId.entries())
          .filter(([rootId, _]) => !myOriginalAssignmentIds.has(rootId))
          .map(([_, assignment]) => assignment);

        console.log("📚 Tổng bài tập:", allAsgs.length);
        console.log("📖 Bài tập của tôi:", myAsgs.length);
        console.log("✅ Có thể copy:", availableAssignments.length);

        setAllAssignments(availableAssignments);
      }
    } catch (err) {
      console.error("Lỗi fetch assignments:", err);
      toast.error("Không tải được danh sách bài tập");
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleCopyAssignments = async () => {
    if (selectedAssignmentIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 bài tập");
      return;
    }

    try {
      const selectedAssignments = allAssignments.filter((a) =>
        selectedAssignmentIds.includes(a.id)
      );

      // Copy từng bài tập
      const copyPromises = selectedAssignments.map(async (assignment) => {
        // 1. Tạo bài tập mới
        const createRes = await axios.post(`${API_BASE}/assignments`, {
          title: assignment.title,
          description: assignment.description,
          type: assignment.type,
          dueDate: assignment.dueDate,
          maxScore: assignment.maxScore,
          passingScore: assignment.passingScore,
          timeLimit: assignment.timeLimit,
          maxAttempts: assignment.maxAttempts,
          shuffleQuestions: assignment.shuffleQuestions,
          showAnswersAfterSubmit: assignment.showAnswersAfterSubmit,
          allowLateSubmission: assignment.allowLateSubmission,
          createdBy: teacherId,
          originalAssignmentId: assignment.originalAssignmentId || assignment.id,
        });

        if (!createRes.data.success) return;

        const newAssignmentId = createRes.data.data.id;

        // 2. Copy câu hỏi từ bài tập gốc
        try {
          const questionsRes = await axios.get(
            `${API_BASE}/assignments-questions/assignments/${assignment.id}/questions`
          );

          if (questionsRes.data.success && questionsRes.data.data.length > 0) {
            const copyQuestionPromises = questionsRes.data.data.map(
              (item: any) =>
                axios.post(
                  `${API_BASE}/assignments-questions/assignments/${newAssignmentId}/questions/${item.questionId}`
                )
            );

            await Promise.all(copyQuestionPromises);
          }
        } catch (err) {
          console.error("Lỗi copy câu hỏi:", err);
        }

        // 3. Gán vào lớp hiện tại
        await axios.post(
          `${API_BASE}/sections-assignments/sections/${sectionId}/assignments`,
          { assignmentId: newAssignmentId }
        );

        return createRes;
      });

      await Promise.all(copyPromises);

      toast.success(`Đã sao chép ${selectedAssignmentIds.length} bài tập`);
      setLibraryModalOpen(false);
      setSelectedAssignmentIds([]);
      setLibraryKeyword("");
      fetchData();
    } catch (err: any) {
      console.error("Lỗi copy:", err);
      toast.error(err.response?.data?.message || "Không thể sao chép bài tập");
    }
  };

  const getStatistics = () => {
    const totalAssignments = assignments.length;
    const assignedAssignments = Object.keys(assignedIds).length;
    const unassignedAssignments = totalAssignments - assignedAssignments;
    const visibleAssignments = Object.values(visibility).filter(v => v === true).length;
    const hiddenAssignments = assignedAssignments - visibleAssignments;

    // Thống kê theo loại
    const byType = assignments.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tổng số câu hỏi trong tất cả bài tập (nếu có)
    const totalQuestions = questions.length;

    return {
      totalAssignments,
      assignedAssignments,
      unassignedAssignments,
      visibleAssignments,
      hiddenAssignments,
      byType,
      totalQuestions,
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
            <CloudUploadOutlined style={{ fontSize: 14, color: "#52c41a" }} />
            <span>Đã gán vào lớp:</span>
            <strong style={{ color: "#52c41a" }}>{stats.assignedAssignments}</strong>
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
            icon={<CopyOutlined />}
            onClick={() => {
              setLibraryModalOpen(true);
              fetchAllAssignments();
            }}
          >
            Lấy từ thư viện
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
        locale={{ emptyText: "Không có bài tập nào" }}
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
          {/* Cột trái: Thông tin bài tập */}
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

          {/* Cột phải: Câu hỏi */}
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
      <Modal
        title="Lấy bài tập từ thư viện"
        open={libraryModalOpen}
        onCancel={() => {
          setLibraryModalOpen(false);
          setSelectedAssignmentIds([]);
          setLibraryKeyword("");
        }}
        onOk={handleCopyAssignments}
        okText={`Sao chép (${selectedAssignmentIds.length})`}
        cancelText="Hủy"
        width={1000}
        centered
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm bài tập..."
            value={libraryKeyword}
            onChange={(e) => setLibraryKeyword(e.target.value)}
          />
        </div>

        {loadingLibrary ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải..." />
          </div>
        ) : allAssignments.filter(
          (a) =>
            !libraryKeyword ||
            a.title.toLowerCase().includes(libraryKeyword.toLowerCase()) ||
            a.description?.toLowerCase().includes(libraryKeyword.toLowerCase())
        ).length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Không có bài tập mới để sao chép</div>
          </div>
        ) : (
          <Table<Assignment>
            dataSource={allAssignments.filter(
              (a) =>
                !libraryKeyword ||
                a.title.toLowerCase().includes(libraryKeyword.toLowerCase()) ||
                a.description?.toLowerCase().includes(libraryKeyword.toLowerCase())
            )}
            columns={[
              {
                title: "Tiêu đề",
                dataIndex: "title",
                key: "title",
                render: (text: string, record: Assignment) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    {record.description && (
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {record.description}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Loại",
                dataIndex: "type",
                key: "type",
                align: "center" as const,
                render: (type: string) => (
                  <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
                ),
              },
              {
                title: "Điểm",
                dataIndex: "maxScore",
                key: "maxScore",
                align: "center" as const,
                render: (score: number) => <Tag color="green">{score}</Tag>,
              },
              {
                title: "Hạn nộp",
                dataIndex: "dueDate",
                key: "dueDate",
                width: 140,
                render: (date: string) =>
                  date ? dayjs(date).format("DD/MM/YYYY HH:mm") : <Tag>Không giới hạn</Tag>,
              },
            ]}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedAssignmentIds,
              onChange: (keys) => setSelectedAssignmentIds(keys as number[]),
            }}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        )}
      </Modal>
    </div>
  );
}